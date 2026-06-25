// SERVER-ONLY helper that mints an ephemeral OpenAI Realtime client secret using the
// secret OPENAI_API_KEY. The browser never sees OPENAI_API_KEY — only the
// short-lived client secret returned inside `session`.
//
// Target model: gpt-realtime-2 (overridable via NEXT_PUBLIC_REALTIME_MODEL).
// If no key is configured, this returns mode:"mock" so the UI can gracefully
// fall back to browser speech / text input.

import { AGENT, AGENT_INSTRUCTIONS, AGENT_TOOLS } from "@/config/agent";
import type { RealtimeSessionResponse } from "@/types/voice";

const REALTIME_MODEL = process.env.NEXT_PUBLIC_REALTIME_MODEL?.trim() || "gpt-realtime-2";
const CLIENT_SECRETS_URL = "https://api.openai.com/v1/realtime/client_secrets";

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
    const response = await fetch(CLIENT_SECRETS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Safety-Identifier": "aurelis-demo-user",
      },
      body: JSON.stringify({
        expires_after: {
          anchor: "created_at",
          seconds: 600,
        },
        session: {
          type: "realtime",
          model: REALTIME_MODEL,
          instructions: AGENT_INSTRUCTIONS,
          output_modalities: ["audio"],
          audio: {
            input: {
              // Transcribe the guest's speech so captions + (fallback) intent
              // matching have something to work with.
              transcription: { model: "gpt-4o-mini-transcribe" },
              // Server-side voice-activity detection drives turn taking.
              turn_detection: { type: "server_vad" },
            },
            output: {
              voice: AGENT.voice,
              // Just above the 1.0 default: natural and unhurried, not clipped.
              speed: 1.05,
            },
          },
          // Function tools let Aurelis actually drive the boutique (navigate
          // categories, open demo flows, etc.) — see config/agent.ts.
          tools: AGENT_TOOLS,
          tool_choice: "auto",
        },
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
