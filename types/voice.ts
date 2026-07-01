// Voice + OpenAI Realtime types.

/** Connection state for the Realtime / fallback voice pipeline. */
export type RealtimeStatus =
  | "idle"
  | "connecting"
  | "connected" // live OpenAI Realtime session (gpt-realtime-2)
  | "mock" // browser fallback (Web Speech) or manual text input
  | "error";

/** Logical commands Aurelis can act on, from voice or text fallback. */
export type CommandId =
  | "select-product"
  | "start-checkout"
  | "start-over";

/** A spoken/typed intent mapping phrases to a command. */
export interface VoiceIntent {
  id: CommandId;
  /** Lowercase trigger phrases matched against recognized text. */
  phrases: string[];
  description: string;
  /** Product resolved for "select <piece>" style intents. */
  productId?: string;
}

/** Result of matching recognized text against the intent table. */
export interface MatchedIntent {
  command: CommandId;
  productId?: string;
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
