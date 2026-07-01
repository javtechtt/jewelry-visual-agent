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
import { speechLevel } from "./audioLevel";
import { reportError } from "@/lib/log";

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
  private audioCtx: AudioContext | null = null;
  private levelRAF = 0;

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
    } catch (err) {
      reportError("realtime-session-fetch", err);
      this.startFallback();
      return;
    }

    if (data.mode === "live" && data.session) {
      try {
        await this.startLive(data.session);
        return;
      } catch (err) {
        // Live path failed (mic denied, SDP, network) — degrade gracefully but
        // don't swallow the reason.
        reportError("realtime-live", err);
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
      this.startLevelMeter(event.streams[0]);
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

  /**
   * Tap Aurelis's audio track with a Web Audio analyser and publish a smoothed
   * 0..1 amplitude to speechLevel each animation frame, so the orb can pulse in
   * time with the actual voice. The analyser is NOT connected to the
   * destination — the <audio> element already plays the sound.
   */
  private startLevelMeter(stream: MediaStream) {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      this.audioCtx = ctx;
      void ctx.resume?.();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let lastTs = 0;
      const tick = (ts: number) => {
        // Throttle to ~30Hz — the orb lerps speechLevel anyway, so a full
        // FFT+RMS every animation frame (60Hz) is wasted work.
        if (ts - lastTs >= 33) {
          lastTs = ts;
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i += 1) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          // Lift typical speech to a satisfying pulse, clamped to 0..1.
          speechLevel.value = Math.min(1, rms * 3.2);
        }
        this.levelRAF = requestAnimationFrame(tick);
      };
      this.levelRAF = requestAnimationFrame(tick);
    } catch {
      /* analyser is optional eye-candy — ignore if the browser blocks it */
    }
  }

  private stopLevelMeter() {
    if (this.levelRAF) {
      cancelAnimationFrame(this.levelRAF);
      this.levelRAF = 0;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    speechLevel.value = 0;
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
    this.stopLevelMeter();
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
