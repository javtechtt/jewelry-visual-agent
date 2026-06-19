"use client";

// Browser fallback for when there is no live OpenAI Realtime session (no API
// key, network failure, or unsupported browser). Uses the Web Speech API when
// available; otherwise voice is unavailable and the user drives the experience
// via the text fallback panel / on-screen controls. Never throws.

import { matchIntent } from "@/config/voice-intents";
import type { MatchedIntent } from "@/types/voice";

interface FallbackHandlers {
  onTranscript?: (text: string) => void;
  onIntent?: (intent: MatchedIntent) => void;
  onError?: (reason: string) => void;
  onEnd?: () => void;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export class VoiceFallback {
  private recognition: unknown = null;
  private active = false;
  private handlers: FallbackHandlers;

  constructor(handlers: FallbackHandlers) {
    this.handlers = handlers;
  }

  start(): boolean {
    if (!isSpeechRecognitionSupported()) {
      this.handlers.onError?.("speech-unsupported");
      return false;
    }
    const w = window as unknown as Record<string, new () => SpeechRecognitionLike>;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onresult = (event: SpeechResultEvent) => {
      const results = event.results;
      const latest = results[results.length - 1];
      const text = latest?.[0]?.transcript ?? "";
      if (!text) return;
      this.handlers.onTranscript?.(text);
      const intent = matchIntent(text);
      if (intent) this.handlers.onIntent?.(intent);
    };
    recognition.onerror = (event: { error?: string }) => {
      this.handlers.onError?.(event.error || "speech-error");
    };
    recognition.onend = () => {
      // Some browsers stop after each utterance; restart while active.
      if (this.active) {
        try {
          recognition.start();
        } catch {
          /* ignore double-start */
        }
      } else {
        this.handlers.onEnd?.();
      }
    };

    this.recognition = recognition;
    this.active = true;
    try {
      recognition.start();
      return true;
    } catch {
      this.handlers.onError?.("speech-start-failed");
      return false;
    }
  }

  stop(): void {
    this.active = false;
    const recognition = this.recognition as SpeechRecognitionLike | null;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    }
  }
}

/** Match arbitrary typed/spoken text to an intent (used by the text fallback). */
export function runTextCommand(text: string): MatchedIntent | null {
  return matchIntent(text);
}

// --- minimal local typings for the (untyped) Web Speech API ---
interface SpeechResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (event: SpeechResultEvent) => void;
  onerror: (event: { error?: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}
