@AGENTS.md

# Aurelis — project guide for agents

**Aurelis** (`jewelry-visual-agent`) is a cinematic, **voice-first, 3D AI luxury
boutique**. The React Three Fiber `<Canvas>` is the primary layer; the DOM is a
thin overlay. An OpenAI Realtime concierge ("Aurelis") guides the guest and
drives the scene through tool calls.

> `docs/PROJECT_STATE.md` is the deep, durable snapshot. Read it for detail;
> this file is the quick orientation.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind 4 ·
React Three Fiber 9 · three 0.184 · @react-three/drei 10 ·
@react-three/postprocessing · framer-motion · Zustand. App lives in the repo
**root** (no `src/`); `@/*` → root. `reactCompiler` is **disabled** in
`next.config.ts` (R3F uses a custom reconciler).

## Commands

- `npm run dev` — dev server (slow path; unminified, HMR).
- `npm run build && npm run start` — production build (**much faster, identical
  visuals**; use this to judge real performance).
- `npm run typecheck` · `npm run lint` · `npm run test` (Vitest, `tests/`).
- `.env.local`: `OPENAI_API_KEY=…` (server-only), optional
  `NEXT_PUBLIC_REALTIME_MODEL=gpt-realtime-2`. No key → graceful browser-speech /
  text fallback.

## Architecture

**Two routes, one experience:**
- `/` — the boutique. `app/page.tsx` mounts `AurelisExperience` (client-only,
  `ssr:false`, WebGL): `CanvasStage` (the 3D scene) + `MinimalControls` +
  `CartOverlay` + `AssetPreloader`.
- `/checkout` — a **real page**, not a modal (`app/checkout/page.tsx` →
  `components/checkout/CheckoutFlow.tsx`): full-screen flow **details → payment →
  confirmation** driven by the store's `checkoutStep`.

**Persistent chrome** — `components/GlobalChrome.tsx` is mounted in
`app/layout.tsx` so it survives navigation between `/` and `/checkout`: the voice
`VoiceController`, `MicButton` (state-morphing orb), `BrandOverlay`,
`VoiceStatusHint`, `TextFallback`, and `CheckoutNavigator` (routes to/from
`/checkout` off the store's `demoFlow`). This keeps the agent live so it can fill
the checkout fields on the checkout page.

**Store = single source of truth** — `lib/stores/useExperienceStore.ts`
(Zustand). Holds `scene` (constant `"boutique-window"`), `selectedProduct`,
`cart`, `checkout*`, `demoFlow` (`"checkout"` only), `agentState`, `view`,
`highlightedProductId`, `lastReceipt`. Actions incl. `selectProduct`,
`clearSelectedProduct`, `focusNextProduct`, `addToCart`/`removeFromCart`,
`updateCheckout`/`placeOrder`, `openDemoFlow`, `startOver`, `runCommand`.
**The agent mutates state only through tools — it never fabricates state.**

**Voice** — `app/api/realtime-session/route.ts` →
`lib/realtime/createRealtimeSession.ts` mints an ephemeral OpenAI Realtime
session (model `gpt-realtime-2`, voice **`marin`**, speed 1.08; instructions +
tools from `config/agent.ts`). `lib/realtime/realtimeClient.ts` runs the WebRTC
handshake; `components/voice/VoiceController.tsx#runToolCall` maps tool calls to
store actions. Tools: `select_product`, `add_to_cart`, `remove_from_cart`,
`start_checkout`, `set_checkout_details`, `set_payment_method`,
`set_payment_details`, `go_to_payment`, `place_order`, `return_to_boutique`,
`start_over`. Fallback path: `config/voice-intents.ts` + `voiceFallback.ts`.

**3D scene** (`components/three/`) — `CanvasStage` (Canvas; split Suspense so the
room/orb persist through loads; frameloop pauses on tab-hidden; WebGL
context-loss guard). `SceneCamera` tweens rest ↔ **focus** framing (a dolly to
the selected piece). `EnvironmentStage` (reflective floor, wall, procedural
`Environment` Lightformers, fog), `LightRig`, `PostProcessing` (Bloom +
`DepthOfField` + Vignette + Noise + ACES), `AgentOrb`. `BoutiqueWindowScene`
lays the pieces in an arc (desktop/landscape) or a swipe carousel (portrait);
`FloatingProductObject` → `ProductObject` renders each GLB (or cutout fallback).

**The focus tool** — hover teases (scale + bloom, camera still); click / voice /
keyboard **commits**: `SceneCamera` dollies to the piece, `DepthOfField` blurs
the neighbours, and a glass **focus card** (`MinimalControls`) shows
name/price/tagline + Add to Bag · Ask Aurelis · ← Collection. Exit via
click-away backdrop, Esc, or the card; ←/→ navigate. Motion tokens
(`HOVER`/`FOCUS`/`EASE`) live in `config/motion.ts`.

**Products & assets** — `config/products.ts` = the flat `PRODUCTS[]` (6 hero
pieces, each with a GLB `model`, `heroRotation`, `modelScale`, `animate`).
Models in `public/models/products/*.glb` (compressed meshopt + WebP; load via
drei `useGLTF`, decoders default-on). To add a piece: drop a GLB and add a
`PRODUCTS` entry — the scene swaps it in.

**Config-driven** — `config/{scenes,agent,products,demo-flows,motion,responsive,voice-intents}.ts`.
`config/scenes.ts` holds `SCENES`, `SCENE_VIEWS`, `getSceneCamera`/`getSceneOrb`,
`BOUTIQUE_LAYOUT`, and `getArcPosition` (shared by the scene + the focus camera).
`config/responsive.ts` = `ViewMode` (desktop/landscape/portrait) + `QUALITY`.

## Constraints & conventions (do not regress)

- **Scene-first**: never a flat card grid / ecommerce table / pasted-on chatbot.
  Aesthetic = light premium (ivory / champagne), `/` is 100vh no-scroll.
- **Demo-safe backend**: checkout does nothing real (`lib/demo/demoActions.ts`,
  `TODO(production)`); card data is local-only and never transmitted.
- **Exposure/lighting**: the scene is deliberately graded down from paper-white —
  keep the warm champagne depth (see `config/scenes.ts` atmosphere,
  `EnvironmentStage` `environmentIntensity`, `LightRig`). There is **no** usable
  renderer `toneMappingExposure` (the postprocessing composer forces
  `NoToneMapping`); grade the sources instead.
- Respect `prefers-reduced-motion` (camera snaps, no bloom/DOF ramp).
- `OPENAI_API_KEY` is **server-only**; for live voice on Vercel it must be set in
  the project's env vars (it is not read from `.env.local` in prod).

## Verifying changes

Prefer real verification over guessing. Run `typecheck` + `lint` + `test` +
`build`, and for anything visual use a **throwaway** headless probe:
`npm install puppeteer-core --no-save`, keep the script in the scratchpad, point
`executablePath` at local Chrome, screenshot at 1440×900 (desktop) / 390×844
(portrait) after ~8–10s settle — then **uninstall the dep** and confirm
`package.json`/lockfile stay clean. Report honestly when something can't be
confirmed headless. Commit/push **only when asked**; end commit messages with the
project's `Co-Authored-By` line. Keep GLB/asset commits separate from code.

## Known limitation

The 6 GLBs are generic placeholders (e.g. the "diamond necklace" is a bead
strand). The focus/zoom now shows pieces up close, so **bespoke or
brand-supplied hero models** are the highest-leverage improvement — swap them in
via `config/products.ts`. See the graphical audit notes in the git history.
