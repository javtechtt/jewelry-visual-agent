"use client";

// Browser-side orchestration for voice. On connect() it asks our server route
// for a session. If a LIVE OpenAI Realtime session is available it wires up a
// WebRTC peer connection with the ephemeral client secret (gpt-realtime-2);
// otherwise it gracefully degrades to the Web Speech fallback.
//
// The starter prioritises "no crashes + correct structure" over full audio
// fidelity. Production wiring points are marked TODO(production).

import type {
  MatchedIntent,
  RealtimeSessionResponse,
  RealtimeStatus,
} from "@/types/voice";
import { matchIntent } from "@/config/voice-intents";
import { VoiceFallback } from "./voiceFallback";

const REALTIME_MODEL =
  process.env.NEXT_PUBLIC_REALTIME_MODEL?.trim() || "gpt-realtime-2";

interface RealtimeClientHandlers {
  onStatus?: (status: RealtimeStatus) => void;
  onTranscript?: (text: string) => void;
  onIntent?: (intent: MatchedIntent) => void;
}

export class RealtimeClient {
  private handlers: RealtimeClientHandlers;
  private fallback: VoiceFallback | null = null;
  private pc: RTCPeerConnection | null = null;
  private stream: MediaStream | null = null;
  private audioEl: HTMLAudioElement | null = null;

  constructor(handlers: RealtimeClientHandlers = {}) {
    this.handlers = handlers;
  }

  private setStatus(status: RealtimeStatus) {
    this.handlers.onStatus?.(status);
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
   * Structured for gpt-realtime-2; guarded so failures fall back cleanly.
   */
  private async startLive(session: unknown): Promise<void> {
    const ephemeral = extractClientSecret(session);
    if (!ephemeral || typeof navigator === "undefined" || !navigator.mediaDevices) {
      throw new Error("missing ephemeral secret or media devices");
    }

    const pc = new RTCPeerConnection();
    this.pc = pc;

    // Remote audio playback.
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
    pc.ontrack = (event) => {
      if (this.audioEl) this.audioEl.srcObject = event.streams[0];
    };

    // Microphone input.
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.stream.getTracks().forEach((track) => pc.addTrack(track, this.stream!));

    // Event channel: transcripts + tool calls arrive here.
    const channel = pc.createDataChannel("oai-events");
    channel.onmessage = (event) => this.handleRealtimeEvent(event.data);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpResponse = await fetch(
      `https://api.openai.com/v1/realtime?model=${encodeURIComponent(REALTIME_MODEL)}`,
      {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeral}`,
          "Content-Type": "application/sdp",
          "OpenAI-Beta": "realtime=v1",
        },
      },
    );

    const answerSdp = await sdpResponse.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    this.setStatus("connected");
  }

  /** Parse Realtime data-channel events for transcript text → intents. */
  private handleRealtimeEvent(raw: string) {
    let event: { type?: string; transcript?: string; delta?: string };
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }
    // TODO(production): handle tool/function-call events to drive store actions
    // directly instead of (or in addition to) transcript matching.
    if (event.type?.includes("transcript")) {
      const text = event.transcript ?? event.delta ?? "";
      if (!text) return;
      this.handlers.onTranscript?.(text);
      const intent = matchIntent(text);
      if (intent) this.handlers.onIntent?.(intent);
    }
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
    if (this.pc) {
      try {
        this.pc.close();
      } catch {
        /* ignore */
      }
      this.pc = null;
    }
    this.audioEl = null;
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
