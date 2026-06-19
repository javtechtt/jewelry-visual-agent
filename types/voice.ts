// Voice + OpenAI Realtime types.

import type { CategoryId } from "./category";
import type { DemoFlowId } from "./experience";

/** Connection state for the Realtime / fallback voice pipeline. */
export type RealtimeStatus =
  | "idle"
  | "connecting"
  | "connected" // live OpenAI Realtime session (gpt-realtime-2)
  | "mock" // browser fallback (Web Speech) or manual text input
  | "error";

/** Logical commands Aurelis can act on, from voice or text fallback. */
export type CommandId =
  | "show-category"
  | "book-appointment"
  | "start-checkout"
  | "connect-human"
  | "request-info"
  | "back-to-boutique"
  | "start-over";

/** A spoken/typed intent mapping phrases to a command. */
export interface VoiceIntent {
  id: CommandId;
  /** Lowercase trigger phrases matched against recognized text. */
  phrases: string[];
  description: string;
  /** Optional category resolved for "show <category>" style intents. */
  category?: CategoryId;
  /** Optional demo flow opened by this intent. */
  demoFlow?: DemoFlowId;
}

/** Result of matching recognized text against the intent table. */
export interface MatchedIntent {
  command: CommandId;
  category?: CategoryId;
  demoFlow?: DemoFlowId;
  /** The raw recognized/typed text that produced the match. */
  transcript: string;
}

/** Shape returned by the /api/realtime-session route. */
export interface RealtimeSessionResponse {
  /** "live" = real ephemeral session minted; "mock" = no key / fallback. */
  mode: "live" | "mock";
  model: string;
  /** Present only in live mode: ephemeral client token + session payload. */
  session?: unknown;
  /** Present in mock mode: why we fell back. */
  reason?: string;
}
