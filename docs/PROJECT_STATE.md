# Aurelis — Project State Snapshot

> A durable, self-contained summary of the project so context survives a
> conversation compaction. Last updated 2026-06-25.

## 1. What it is

**Aurelis** (`jewelry-visual-agent`) is a cinematic, **voice-first, 3D AI luxury
boutique**. The 3D `<Canvas>` is the primary layer; DOM is a thin overlay. An
OpenAI Realtime voice concierge ("Aurelis") guides the guest, driving the scene
through tool/function calls.

- **Repo:** https://github.com/javtechtt/jewelry-visual-agent (branch `main`).
- **Layout:** app lives in the repo root (no `src/`); `@/*` → root.
- **Today's product:** a polished demo/prototype. Checkout now *looks and feels
  real* (no "demo" language) but the backend is still a **no-op** (no charge).

### Hard constraints (do not regress)
- Stays **3D/2.5D scene-first** — never a flat UI / card grid / chatbot widget.
- Aesthetic = **light premium** (ivory / pearl / champagne), **100vh no-scroll**.
- Two screens, camera-driven: **Boutique Window** (5 category panels) →
  **Luminous Atelier** (big orb + orbiting product options).
- Voice = OpenAI Realtime, model **`gpt-realtime-2`**. `OPENAI_API_KEY` is
  server-only; no key → graceful `mode:"mock"` (Web Speech / text fallback).
- Demo-safe backend: checkout/booking/lead/handoff do nothing real
  (`TODO(production)` markers in `lib/demo/`).

## 2. Stack & commands

Next.js 16 (Turbopack) · React 19 · React Three Fiber 9 · three 0.184 · drei 10 ·
@react-three/postprocessing · framer-motion · zustand · Tailwind 4. TypeScript.

- `npm run dev` — dev server (slow path: unminified, HMR).
- `npm run build` && `npm run start` — **production build (much faster, identical
  visuals)**. Use this to judge real performance, not dev.
- `.env.local`: `OPENAI_API_KEY=…`, `NEXT_PUBLIC_REALTIME_MODEL=gpt-realtime-2`.
- `reactCompiler` is **disabled** in `next.config.ts` (R3F custom reconciler).
- Verify: `npx tsc --noEmit -p tsconfig.json`. Visual/perf checks were done with
  throwaway `puppeteer-core` probes (installed then uninstalled each time).

## 3. Architecture

### Store = single source of truth — `lib/stores/useExperienceStore.ts`
Holds: `scene`, `activeCategory`, `selectedProduct`, **`cart: CartItem[]`**,
`agentState`, `realtimeStatus`, `micActive`, `demoFlow`, `view` (responsive),
`lastReceipt`. Actions: `enterCategory`, `selectProduct`,
**`addToCart`/`removeFromCart`/`clearCart`**, `openDemoFlow`, `runCommand`,
`backToBoutique`, `startOver`, etc. **The agent only mutates state via tools;
it never fabricates state.**

### Voice / Realtime
- **Server:** `app/api/realtime-session/route.ts` → `lib/realtime/createRealtimeSession.ts`
  mints an ephemeral client secret (`POST /v1/realtime/client_secrets`). Session
  config carries `tools` (= `AGENT_TOOLS`), `audio.input.transcription`
  (`gpt-4o-mini-transcribe`), `audio.output` `{ voice:"alloy", speed:1.1 }`.
- **Client:** `lib/realtime/realtimeClient.ts` — WebRTC SDP exchange with
  `https://api.openai.com/v1/realtime/calls` (model rides in the session, no
  `?model=` needed). Handles `response.function_call_arguments.done` →
  `onToolCall`, returns `function_call_output` + `response.create`, drives
  `agentState`, appends the audio element to the DOM, greets on channel open.
  Fallback: `lib/realtime/voiceFallback.ts` (Web Speech).
- **`components/voice/VoiceController.tsx`** — `runToolCall(name,args)` maps tool
  calls to store actions. `select_product`/`add_to_cart` search **every**
  category with fuzzy word-overlap matching and **auto-open** the right one.
- **`config/agent.ts`** — `AGENT` (persona/lines/voice), `AGENT_INSTRUCTIONS`
  (brief; real concierge; **never announce opening a screen — guide instead**;
  product catalog injected so the model uses exact names), `AGENT_TOOLS`.

**Tools:** `show_category`, `select_product`, `add_to_cart`, `remove_from_cart`,
`start_checkout`, `book_appointment`, `capture_lead`, `connect_human`,
`back_to_boutique`, `start_over`. Flow-opening tools return *directives*
(e.g. "Checkout is open. Do NOT announce it — ask for the name on the order").

### Cart & checkout
- `lib/cart.ts` — `parsePrice`, `cartCount`, `cartTotal`, `cartTotalLabel`.
- `components/overlays/CartOverlay.tsx` — "Your Bag" glass panel (top-right):
  items, qty, line prices, total, remove, Checkout button. Hidden when empty.
- `components/overlays/DemoCheckoutOverlay.tsx` — checkout over the **whole
  cart** (summary → details → review → processing → confirmation); clears the
  cart on order. `lib/demo/demoActions.ts#runCheckout` takes `{items,total,…}`.
- Other flows (booking/lead/handoff) + `DemoFlowShell.tsx` still use per-flow
  `config/demo-flows.ts` copy. **Only checkout has been de-"demo"-ed so far.**

### 3D scene
- `components/three/CanvasStage.tsx` — `<Canvas shadows dpr={QUALITY[view].dpr}
  gl={{antialias:false, powerPreference:"high-performance"}}>`; mounts
  SceneCamera, LightRig, then the **persistent room + orb** (EnvironmentStage,
  CursorFloorGlow, AgentOrb) in their **own Suspense**, the scene in a **separate
  Suspense**, PostProcessing, a FrameloopManager (pauses render on tab-hidden),
  and a ContextLossGuard. Splitting the Suspense keeps the room from blacking out
  during a scene change (the old "blink"); `AssetPreloader` warms assets on idle.
- `BoutiqueWindowScene` — **desktop/landscape**: `FloatingCategoryObject` per
  category in a horizontal arc. **Portrait (phones)**: a swipeable single-hero
  carousel (auto-advances unless reduced-motion). The orb is rendered by
  CanvasStage, not the scene.
- `LuminousAtelierScene` → `AtelierOption` (per product option): glass case
  (`ProductDisplayPanel`) + `ProductObject` (cutout image) **spin together as one
  turntable**; hover scales the whole case; the **label fades by orbit position
  (front half visible)**; selecting a piece **rotates the ring to it and holds**.
- `components/three/ProductObject.tsx` — renders, in priority: GLB **model**
  (auto-fit + center; error-boundary falls back to the image), else **cutout**
  image (two `FrontSide` planes — front + back-rotated-180° so both faces are
  equally vibrant; rounded corners; cover-cropped to the case), else a
  placeholder mesh. Image planes have `raycast` disabled.
- `components/three/AgentOrb.tsx` — pearlescent distort orb + Fresnel aura +
  halos + crossed rings + sparkles + point light + cursor-proximity flare. All
  glow layers have `raycast` disabled. Core `icosahedronGeometry` detail = 10.
- `components/three/EnvironmentStage.tsx` — reflective floor
  (`MeshReflectorMaterial`, res 512), back wall, `ContactShadows` (res 512),
  procedural `Environment` (Lightformers, `frames={1}`), fog. Floor + wall have
  `raycast` disabled.
- `components/three/PostProcessing.tsx` — `EffectComposer multisampling={0}`,
  `SMAA`, `Bloom` (intensity 0.92, **luminanceThreshold 1.1, smoothing 0.08**,
  radius 0.8, mipmapBlur), `Vignette`, `ToneMapping` **ACES_FILMIC**.
- `config/scenes.ts` — `SCENES` + responsive `SCENE_VIEWS`,
  `getSceneCamera`/`getSceneOrb`, `BOUTIQUE_LAYOUT`, `ATELIER_LAYOUT`.
- `config/responsive.ts` — `ViewMode` (desktop/landscape/portrait), `QUALITY`
  (**dpr cap 1.5**, reflector + contact-shadow res 512).

### Categories & assets
- `config/categories.ts` — 5 categories: **watches, jewelry, bags, fragrances,
  accessories** (gifts & services were removed). Each gets a `cutout` (Unsplash
  hero) + a `model` (GLB) from `config/showcase-images.ts`
  (`CATEGORY_SHOWCASE`, `CATEGORY_MODEL`, `OPTION_SHOWCASE`).
- `config/category-options.ts` — 4 product options per category (name + price).
- `public/models/products/*.glb` — **compressed** (meshopt geometry + 2K WebP
  textures; ~205 MB → ~9.5 MB). They load via drei `useGLTF`, which enables the
  meshopt + Draco decoders by default — **no loader config needed**.
- Showcase images are Unsplash (`?w=760&h=1000…fit=crop`, portrait to match the
  case). They're the Atelier option visuals + the GLB fallback.

## 4. Notable decisions / fixes (so they aren't re-litigated)
- **Whole-page blink** = `EffectComposer multisampling={4}` emitting black frames
  on Windows/ANGLE → fixed with `multisampling={0}` + `SMAA`.
- **"Mist / dull"** = bloom veiling from a soft threshold over a bright scene →
  raised threshold to 1.1 / smoothing 0.08; swapped AGX → ACES; trimmed fill
  light. (Some haze may remain — it's the bright environment, acceptable.)
- **Cursor glow** is an **in-scene floor light pool** (`CursorFloorGlow`), NOT a
  DOM `mix-blend-mode` overlay (that flickered over the live canvas).
- **Label occlusion**: drei `occlude` over-occluded (panes hid each other) →
  replaced with **orbit-angle opacity fade** (front half visible, ~2 labels).
- **Two-sided image vibrancy**: two `FrontSide` planes (back rotated 180°), not
  `BackSide` (which renders mirrored/looked different).
- **Glass `depthWrite={false}`** so the rotating case never depth-culls the
  recessed image.
- **Selection reliability**: search all categories + fuzzy match + auto-open; the
  product catalog is injected into the prompt so the model passes exact names.
- **Performance** (all visually invisible): GLB compression; DPR cap 1.5;
  reflector/contact-shadow/shadow-map → 512; orb detail 14→10; canvas
  `antialias:false` (SMAA does AA); removed unused Geist Mono font + `gsap` dep.

## 5. Known TODOs / not done
- **Voice-fill is DONE** — the agent fills checkout (`set_checkout_details`,
  `set_payment_method`, `set_payment_details`, `go_to_payment`, `place_order`)
  and booking (`set_appointment`, `confirm_appointment`) live; handlers in
  `components/voice/VoiceController.tsx`, tools in `config/agent.ts`.
- **Real backends** are still no-ops — `TODO(production)` in
  `lib/demo/demoActions.ts` (payment / CRM / calendar / handoff / email).
- **Observability** — `lib/log.ts#reportError` console-logs only; wire Sentry
  for production.
- **`bags.glb` (4.5MB)** is the heavy asset (mostly geometry); a real reduction
  needs a source re-export, not lossy GLB decimation.
- **Tests** cover the pure logic (`lib/*`) via Vitest; no e2e/Playwright yet.
- **CI** runs typecheck → lint → test → build (`.github/workflows/ci.yml`).

## 6. Working style notes
- Verify changes (typecheck + dev compile + targeted headless probe) rather than
  guessing; report honestly when something can't be visually confirmed headless.
- Keep the GLB/asset commits separate from code; the user manages model swaps.
- Commit/push only when asked. End commit messages with the project's
  `Co-Authored-By` line.
