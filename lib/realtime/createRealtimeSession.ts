// SERVER-ONLY helper that mints an ephemeral OpenAI Realtime session using the
// secret OPENAI_API_KEY. The browser never sees OPENAI_API_KEY — only the
// short-lived client secret returned inside `session`.
//
// Target model: gpt-realtime-2 (overridable via NEXT_PUBLIC_REALTIME_MODEL).
// If no key is configured, this returns mode:"mock" so the UI can gracefully
// fall back to browser speech / text input.

import { AGENT, AGENT_INSTRUCTIONS } from "@/config/agent";
import type { RealtimeSessionResponse } from "@/types/voice";

const REALTIME_MODEL = process.env.NEXT_PUBLIC_REALTIME_MODEL?.trim() || "gpt-realtime-2";
const SESSIONS_URL = "https://api.openai.com/v1/realtime/sessions";

export async function createRealtimeSession(): Promise<RealtimeSessionResponse> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return {
      mode: "mock",
      model: REALTIME_MODEL,
      reason: "OPENAI_API_KEY is not set — using browser/text fallback.",
    };
  }

  try {
    const response = await fetch(SESSIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1",
      },
      body: JSON.stringify({
        model: REALTIME_MODEL,
        voice: AGENT.voice,
        instructions: AGENT_INSTRUCTIONS,
        modalities: ["audio", "text"],
      }),
      // Realtime sessions are short-lived; never cache them.
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return {
        mode: "mock",
        model: REALTIME_MODEL,
        reason: `OpenAI responded ${response.status}: ${detail.slice(0, 200)}`,
      };
    }

    const session = await response.json();
    return { mode: "live", model: REALTIME_MODEL, session };
  } catch (error) {
    return {
      mode: "mock",
      model: REALTIME_MODEL,
      reason: error instanceof Error ? error.message : "Failed to create session.",
    };
  }
}
