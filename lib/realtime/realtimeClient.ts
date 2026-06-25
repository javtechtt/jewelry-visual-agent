"use client";

// Browser-side orchestration for voice. connect() asks our server route for a
// session. With a LIVE OpenAI Realtime session it opens a WebRTC peer
// connection with the ephemeral client secret (gpt-realtime-2) and lets the
// model DRIVE the boutique through tool/function calls; otherwise it gracefully
// degrades to the Web Speech fallback.

import type { AgentState } from "@/types/experience";
import type {
  MatchedIntent,
  RealtimeSessionResponse,
  RealtimeStatus,
} from "@/types/voice";
import { VoiceFallback } from "./voiceFallback";

interface RealtimeClientHandlers {
  onStatus?: (status: RealtimeStatus) => void;
  onTranscript?: (text: string) => void;
  /** Intent from the Web Speech fallback path (live path uses onToolCall). */
  onIntent?: (intent: MatchedIntent) => void;
  /** Live conversation lifecycle → orb/agent state. */
  onAgentState?: (state: AgentState) => void;
  /** Run a tool the model called; return a short result string for the model. */
  onToolCall?: (name: string, args: Record<string, unknown>) => string | void;
}

export class RealtimeClient {
  private handlers: RealtimeClientHandlers;
  private fallback: VoiceFallback | null = null;
  private pc: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;
  private stream: MediaStream | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private assistantTranscript = "";

  constructor(handlers: RealtimeClientHandlers = {}) {
    this.handlers = handlers;
  }

  private setStatus(status: RealtimeStatus) {
    this.handlers.onStatus?.(status);
  }

  /** Send an event to the model over the data channel (no-op if not open). */
  private send(payload: unknown) {
    if (this.channel && this.channel.readyState === "open") {
      this.channel.send(JSON.stringify(payload));
    }
  }

  async connect(): Promise<void> {
    this.setStatus("connecting");

    let data: RealtimeSessionResponse;
    try {
      const res = await fetch("/api/realtime-session", { method: "POST" });
      data = (await res.json()) as RealtimeSessionResponse;
    } catch {
      this.startFallback();
      return;
    }

    if (data.mode === "live" && data.session) {
      try {
        await this.startLive(data.session);
        return;
      } catch {
        // Live path failed — degrade gracefully.
        this.startFallback();
        return;
      }
    }

    this.startFallback();
  }

  /**
   * WebRTC handshake with OpenAI Realtime using the ephemeral client secret.
   * The session (model, tools, transcription) is already configured server-side
   * in createRealtimeSession; here we just exchange SDP and wire the channels.
   */
  private async startLive(session: unknown): Promise<void> {
    const ephemeral = extractClientSecret(session);
    if (!ephemeral || typeof navigator === "undefined" || !navigator.mediaDevices) {
      throw new Error("missing ephemeral secret or media devices");
    }

    const pc = new RTCPeerConnection();
    this.pc = pc;

    // Remote audio playback. Appended to the DOM so every browser plays it.
    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    audioEl.style.display = "none";
    document.body.appendChild(audioEl);
    this.audioEl = audioEl;
    pc.ontrack = (event) => {
      audioEl.srcObject = event.streams[0];
    };

    // Microphone input.
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.stream.getTracks().forEach((track) => pc.addTrack(track, this.stream!));

    // Event channel: transcripts + tool calls arrive here.
    const channel = pc.createDataChannel("oai-events");
    this.channel = channel;
    channel.onmessage = (event) => this.handleRealtimeEvent(event.data);
    channel.onopen = () => {
      // Prompt Aurelis to greet the guest the moment the link is live.
      this.send({ type: "response.create" });
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${ephemeral}`,
        "Content-Type": "application/sdp",
      },
    });

    if (!sdpResponse.ok) {
      const detail = await sdpResponse.text().catch(() => "");
      throw new Error(`Realtime SDP exchange failed ${sdpResponse.status}: ${detail.slice(0, 200)}`);
    }

    const answerSdp = await sdpResponse.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    this.setStatus("connected");
  }

  /** Parse Realtime data-channel events: tool calls, captions, agent state. */
  private handleRealtimeEvent(raw: string) {
    let event: {
      type?: string;
      transcript?: string;
      delta?: string;
      name?: string;
      call_id?: string;
      arguments?: string;
    };
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }
    const type = event.type ?? "";

    // --- conversation lifecycle → orb / agent state ---
    if (type === "input_audio_buffer.speech_started") {
      this.handlers.onAgentState?.("listening");
      return;
    }
    if (type === "response.created") {
      this.assistantTranscript = "";
      this.handlers.onAgentState?.("speaking");
      return;
    }
    if (type === "response.done") {
      this.handlers.onAgentState?.("listening");
      return;
    }

    // --- the model called a tool → run it in the boutique ---
    if (type === "response.function_call_arguments.done") {
      this.handleFunctionCall(event);
      return;
    }

    // --- captions: Aurelis' spoken words (streamed) ---
    if (type.startsWith("response.") && type.includes("audio_transcript") && type.endsWith("delta")) {
      this.assistantTranscript += event.delta ?? "";
      if (this.assistantTranscript) this.handlers.onTranscript?.(this.assistantTranscript);
      return;
    }
    // --- captions: the guest's transcribed words ---
    if (type.includes("input_audio_transcription") && type.endsWith("completed")) {
      if (event.transcript) this.handlers.onTranscript?.(event.transcript);
    }
  }

  /** Execute a model tool call, return its result, and let the model continue. */
  private handleFunctionCall(event: { name?: string; call_id?: string; arguments?: string }) {
    if (!event.name) return;
    let args: Record<string, unknown> = {};
    try {
      args = event.arguments ? JSON.parse(event.arguments) : {};
    } catch {
      /* ignore malformed arguments */
    }
    const result = this.handlers.onToolCall?.(event.name, args);
    this.send({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: event.call_id,
        output: typeof result === "string" ? result : "done",
      },
    });
    // Ask the model to acknowledge the action out loud.
    this.send({ type: "response.create" });
  }

  private startFallback() {
    this.fallback = new VoiceFallback({
      onTranscript: (text) => this.handlers.onTranscript?.(text),
      onIntent: (intent) => this.handlers.onIntent?.(intent),
      onError: () => this.setStatus("mock"),
    });
    this.fallback.start();
    // Whether or not speech is supported we present a working "mock" pipeline;
    // the text fallback + on-screen controls always remain available.
    this.setStatus("mock");
  }

  disconnect(): void {
    this.fallback?.stop();
    this.fallback = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    if (this.channel) {
      try {
        this.channel.close();
      } catch {
        /* ignore */
      }
      this.channel = null;
    }
    if (this.pc) {
      try {
        this.pc.close();
      } catch {
        /* ignore */
      }
      this.pc = null;
    }
    if (this.audioEl) {
      this.audioEl.srcObject = null;
      this.audioEl.remove();
      this.audioEl = null;
    }
    this.setStatus("idle");
  }
}

/** Pull the ephemeral client secret from various possible session shapes. */
function extractClientSecret(session: unknown): string | null {
  if (!session || typeof session !== "object") return null;
  const s = session as Record<string, unknown>;
  const secret = s.client_secret as { value?: string } | undefined;
  if (secret?.value) return secret.value;
  if (typeof s.value === "string") return s.value;
  return null;
}
