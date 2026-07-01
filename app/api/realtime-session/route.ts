// Server route that mints an ephemeral OpenAI Realtime session (gpt-realtime-2).
// The browser POSTs here to obtain a short-lived client secret for WebRTC.
// OPENAI_API_KEY stays server-side and is NEVER returned to the client.
// With no key configured this returns mode:"mock" for graceful fallback.
//
// Abuse guard: minting a session is a *billable* OpenAI call, so POST is gated
// by a same-origin check + a per-IP in-memory rate limit, and the convenience
// GET mint was removed (GET is now a non-billable status probe).

import { NextResponse, type NextRequest } from "next/server";
import { createRealtimeSession } from "@/lib/realtime/createRealtimeSession";

// Realtime sessions are per-request and short-lived — never statically cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Per-instance fixed-window limiter. Not distributed (resets per cold start /
// per serverless instance) — pair with an edge/CDN limiter in production, but
// this alone stops the trivial "hammer the endpoint" cost-abuse vector.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const MAX_KEYS = 5_000; // bound memory: sweep expired entries past this size
const hits = new Map<string, { count: number; reset: number }>();

function sweepExpired(now: number): void {
  for (const [key, entry] of hits) {
    if (now > entry.reset) hits.delete(key);
  }
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    if (hits.size > MAX_KEYS) sweepExpired(now);
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

// Best-effort client IP. Behind a trusted proxy/CDN this is the real client; a
// direct caller can spoof x-forwarded-for, so this limiter is a deterrent, not a
// hard gate — pair with an edge/CDN limiter in production.
function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "local";
}

/** Require a same-origin browser Origin (or an explicit ALLOWED_ORIGINS entry).
 *  A missing Origin (non-browser callers) is rejected. */
function originAllowed(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const allow = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allow.includes(origin)) return true;
  try {
    const host = req.headers.get("host");
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!originAllowed(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (rateLimited(clientIp(req))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const result = await createRealtimeSession();
  return NextResponse.json(result);
}

// GET no longer mints a billable session — it only reports liveness so the
// endpoint can't be used to burn OpenAI spend by simply opening a URL.
export function GET() {
  return NextResponse.json({ ok: true, hint: "POST to mint a Realtime session." });
}
