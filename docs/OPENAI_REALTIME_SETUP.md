# OpenAI Realtime Setup

Aurelis is **Realtime-ready**. The voice architecture is structured for the
OpenAI Realtime API targeting model **`gpt-realtime-2`**. With no key configured
it runs in a graceful fallback mode, so the app works out of the box.

## 1. Environment variables

Create `.env.local` (gitignored) from `.env.example`:

```env
OPENAI_API_KEY=
NEXT_PUBLIC_REALTIME_MODEL=gpt-realtime-2
```

- `OPENAI_API_KEY` — **server-side only**. It is read in
  `lib/realtime/createRealtimeSession.ts` and **never** sent to the browser.
- `NEXT_PUBLIC_REALTIME_MODEL` — public; used to label status and negotiate the
  WebRTC connection. Defaults to `gpt-realtime-2` if unset.

## 2. How it works

```
Browser (mic)                     Next.js server                 OpenAI
─────────────                     ──────────────                 ──────
RealtimeClient.connect()
   │  POST /api/realtime-session ───────►  createRealtimeSession()
   │                                          │  POST /v1/realtime/sessions
   │                                          │  (Authorization: OPENAI_API_KEY)
   │                                          └──────────────────────► (ephemeral
   │  ◄──── { mode:"live", session } ◄────────  returns client_secret )  secret)
   │
   │  WebRTC offer (SDP) ──────────────────────────────────────────►  /v1/realtime
   │  ◄──────────────────────────── answer (SDP) ──────────────────
   ▼
 audio + data channel (transcripts → intents → store.runCommand)
```

- **No key / error** → the route returns `{ mode: "mock" }` and the client falls
  back to the **Web Speech API**; if that's unavailable, the **text fallback**
  and on-screen controls still drive everything.
- The browser only ever receives a **short-lived ephemeral client secret**, not
  `OPENAI_API_KEY`.

## 3. Key files

| File | Role |
| ---- | ---- |
| `app/api/realtime-session/route.ts` | Server route; mints the session (POST). |
| `lib/realtime/createRealtimeSession.ts` | Calls OpenAI with the secret key. |
| `lib/realtime/realtimeClient.ts` | Browser WebRTC client + fallback switch. |
| `lib/realtime/voiceFallback.ts` | Web Speech recognition + text matching. |
| `config/agent.ts` | Aurelis persona + `AGENT_INSTRUCTIONS` (system prompt). |
| `config/voice-intents.ts` | Phrase → command mapping. |

## 4. Supported voice commands

`show watches` · `show jewelry` · `show bags` · `show fragrances` ·
`show accessories` · `show gifts` · `show services` · `book appointment` ·
`start checkout` · `connect me to a human` · `back to boutique` · `start over`
(plus "leave my details" → lead capture).

Edit or extend these in `config/voice-intents.ts`.

## 5. Quick check

Visit `http://localhost:3000/api/realtime-session` (GET) — you'll see
`{"mode":"mock", ...}` without a key, or `{"mode":"live", ...}` once configured.

## 6. Production hardening (later)

- Handle Realtime **tool/function-call** events in
  `realtimeClient.handleRealtimeEvent` to drive store actions directly (the
  hook + `TODO(production)` marker are already in place).
- Rate-limit `/api/realtime-session` and scope ephemeral tokens.
- Confirm the exact session-creation endpoint/params for `gpt-realtime-2` in the
  current OpenAI docs and adjust `createRealtimeSession.ts` if needed.
