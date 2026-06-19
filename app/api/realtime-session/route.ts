// Server route that mints an ephemeral OpenAI Realtime session (gpt-realtime-2).
// The browser POSTs here to obtain a short-lived client secret for WebRTC.
// OPENAI_API_KEY stays server-side and is NEVER returned to the client.
// With no key configured this returns mode:"mock" for graceful fallback.

import { NextResponse } from "next/server";
import { createRealtimeSession } from "@/lib/realtime/createRealtimeSession";

// Realtime sessions are per-request and short-lived — never statically cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const result = await createRealtimeSession();
  return NextResponse.json(result);
}

// GET is provided as a convenience for quickly checking configuration in a
// browser (e.g. visiting /api/realtime-session shows live vs mock + model).
export async function GET() {
  const result = await createRealtimeSession();
  return NextResponse.json(result);
}
