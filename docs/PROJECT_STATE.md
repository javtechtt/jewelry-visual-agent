# Aurelis — Project State Snapshot

> A durable, self-contained summary of the project so context survives a
> conversation compaction. Last updated 2026-07-02.

## 1. What it is

**Aurelis** (`jewelry-visual-agent`) is a cinematic, **voice-first, 3D AI luxury
boutique**. The 3D `<Canvas>` is the primary layer; DOM is a thin overlay. An
OpenAI Realtime voice concierge ("Aurelis") guides the guest, driving the scene
through tool/function calls.

- **Repo:** https://github.com/javtechtt/jewelry-visual-agent (branch `main`).
- **Layout:** app lives in the repo root (no `src/`); `@/*` → root.
- **Today's product:** a polished demo/prototype. Checkout *looks and feels real*
  (no "demo" language) but the backend is still a **no-op** (no charge).

### Hard constraints (do not regress)
- Stays **3D/2.5D scene-first** — never a flat UI / card grid / chatbot widget.
- Aesthetic = **light premium** (warm ivory / champagne), **100vh no-scroll** on `/`.
- **Single boutique home page** — one camera-framed scene shows the collection
  directly (no categories, no second screen). The guest selects a piece; Aurelis
  takes them to checkout.
- Voice = OpenAI Realtime, model **`gpt-realtime-2`**. `OPENAI_API_KEY` is
  server-only; no key → graceful `mode:"mock"` (Web Speech / text fallback). For
  live voice on Vercel it must be set in the project env (not read from `.env.local`).
- Demo-safe backend: checkout does nothing real (`TODO(production)` in
  `lib/demo/`); card data is local-only and never transmitted.
- Respect `prefers-reduced-motion` (camera snaps, no bloom/DOF ramp).

## 2. Stack & commands

Next.js 16 (Turbopack) · React 19 · React Three Fiber 9 · three 0.184 · drei 10 ·
@react-three/postprocessing · framer-motion · zustand · Tailwind 4. TypeScript.

- `npm run dev` — dev server (slow path: unminified, HMR).
- `npm run build && npm run start` — **production build (much faster, identical
  visuals)**. Use this to judge real performance, not dev.
- `npm run typecheck` · `npm run lint` · `npm run test` (Vitest).
- `.env.local`: `OPENAI_API_KEY=…`, optional `NEXT_PUBLIC_REALTIME_MODEL=gpt-realtime-2`.
- `reactCompiler` is **disabled** in `next.config.ts` (R3F custom reconciler).
- Visual/perf checks: throwaway `puppeteer-core` probes (installed → used →
  uninstalled each time; scripts kept in the scratchpad; lockfile stays clean).

## 3. Architecture

### Two routes, one experience
- `/` — the boutique. `app/page.tsx` mounts **`AurelisExperience`** client-only
  (`ssr:false`, WebGL): `CanvasStage` (3D scene) + `MinimalControls` + `CartOverlay`
  + `AssetPreloader`.
- `/checkout` — a **real page**, not a modal. `app/checkout/page.tsx` →
  `components/checkout/CheckoutFlow.tsx`.
- **`components/GlobalChrome.tsx`** is mounted in `app/layout.tsx`, so it persists
  across the route: `VoiceController`, `MicButton`, `BrandOverlay`,
  `VoiceStatusHint`, `TextFallback`, and **`CheckoutNavigator`**. This keeps the
  voice agent connected on `/checkout` so it can fill the fields there.

### Store = single source of truth — `lib/stores/useExperienceStore.ts`
Holds: `scene` (constant `"boutique-window"`), `selectedProduct`,
`highlightedProductId`, **`cart: CartItem[]`**, `agentState`, `realtimeStatus`,
`micActive`, `demoFlow` (only `"checkout"`), `view` (responsive), `checkout*`
(live form), `lastReceipt`. Actions: `selectProduct` (focus a piece),
`clearSelectedProduct`, `focusNextProduct(±1)`, `highlightProduct`,
**`addToCart`/`removeFromCart`/`clearCart`**, `updateCheckout`/`updateCard`/
`placeOrder`, `openDemoFlow`/`closeDemoFlow`, `startOver`, `runCommand`.
`removeFromCart` auto-closes checkout if it empties the bag; `placeOrder` refuses
to finalize without complete contact details; **`startOver` preserves the live
voice session** (only the mic button stops the mic). **The agent only mutates
state via tools; it never fabricates state.**

### Voice / Realtime
- **Server:** `app/api/realtime-session/route.ts` (same-origin guard + per-IP rate
  limit) → `lib/realtime/createRealtimeSession.ts` mints an ephemeral client
  secret. Session `audio.output` = **`{ voice:"marin", speed:1.08 }`**; input
  transcription `gpt-4o-mini-transcribe`; `tools` = `AGENT_TOOLS`.
- **Client:** `lib/realtime/realtimeClient.ts` — WebRTC SDP exchange with
  `https://api.openai.com/v1/realtime/calls`. Routes `response.function_call_arguments.done`
  → `onToolCall`; exposes `onAssistantTranscript` (used to **glow the piece
  Aurelis names**). Fallback: `lib/realtime/voiceFallback.ts` (Web Speech).
- **`components/voice/VoiceController.tsx`** — `runToolCall` maps tools to store
  actions; `matchProduct` fuzzy-matches spoken names against the flat `PRODUCTS`.
- **`config/agent.ts`** — `AGENT` (persona/lines/voice `marin`),
  `AGENT_INSTRUCTIONS` (warm, chatty, **lightly flirty, never sultry**; never
  announce opening a screen; flat product catalog injected), `AGENT_TOOLS`.

**Tools:** `select_product`, `add_to_cart`, `remove_from_cart`, `start_checkout`,
`set_checkout_details`, `set_payment_method`, `set_payment_details`,
`go_to_payment`, `place_order`, **`return_to_boutique`**, `start_over`.
Checkout-advancing tools re-validate contact details before payment/placing;
`return_to_boutique`/`start_over` never touch the mic (voice stays live).

### Cart & checkout
- `lib/cart.ts` — `parsePrice`, `cartCount`, `cartTotal`, `cartTotalLabel`.
- `components/overlays/CartOverlay.tsx` — "Your Bag" glass panel (top-right, on
  `/`): items, qty, total, remove, Checkout. Hidden when empty or during checkout.
- `components/checkout/CheckoutFlow.tsx` — the `/checkout` **page** (full-screen,
  on a soft champagne-tinted photo backdrop, `.checkout-page` in globals.css):
  screens **details → payment → processing → confirmation** driven by the store's
  `checkoutStep`, over the whole cart. `CheckoutNavigator` routes to `/checkout`
  when `demoFlow` opens (button OR agent) and home when it closes (Return / Esc /
  Back). `lib/demo/demoActions.ts#runCheckout` is a no-op that returns a receipt.

### 3D scene (`components/three/`)
- `CanvasStage.tsx` — `<Canvas shadows dpr={QUALITY[view].dpr}
  gl={{antialias:false, powerPreference:"high-performance"}}>`; mounts SceneCamera,
  LightRig, the **persistent room + orb** (EnvironmentStage, CursorFloorGlow,
  AgentOrb) in their **own Suspense**, the scene in a **separate Suspense**,
  PostProcessing, a FrameloopManager (pause on tab-hidden), a ContextLossGuard.
- `SceneCamera.tsx` — tweens the camera. **Rest** = the boutique framing (camera
  pulled in to z ≈ 7.5 so pieces read present); **focus** = a soft ~1s dolly in
  front of the selected piece (parallax muted, reduced-motion snaps). Uses
  `getArcPosition` to find the piece.
- `EnvironmentStage.tsx` — reflective floor (`MeshReflectorMaterial`, low
  `mirror 0.22` / rough → soft champagne gradient, not a white mirror), back wall,
  `ContactShadows`, procedural `Environment` (Lightformers, `environmentIntensity
  0.82`), fog. Tinted to the graded-down warm atmosphere. Floor + wall `raycast`
  disabled.
- `LightRig.tsx` — hemisphere + ambient + warm key (shadow) + cool fill + spot,
  all intensities trimmed ~20% from the blown-out originals.
- `PostProcessing.tsx` — `EffectComposer multisampling={0}`, `SMAA`, `Bloom`
  (threshold 1.1), **`DepthOfField`** (kept mounted; bokeh animated 0→~2.6 only
  while a piece is focused, autofocus via `target`), `Vignette` (0.26 / 0.52),
  `Noise` (fine grain), `ToneMapping` **ACES_FILMIC**. *There is no usable renderer
  `toneMappingExposure` — the composer forces `NoToneMapping`; grade the sources.*
- `AgentOrb.tsx` — pearlescent orb: champagne at rest, **emerald when listening,
  sapphire when speaking**; pulses to the actual voice level. Glow layers `raycast`
  disabled.
- `BoutiqueWindowScene.tsx` — **desktop/landscape**: `FloatingProductObject` per
  piece in a horizontal arc (positions from `getArcPosition`); a click-away
  backdrop mesh appears while focused. **Portrait**: a swipeable single-hero
  carousel (auto-advances unless reduced-motion). The orb is rendered by CanvasStage.
- `ProductObject.tsx` — renders a GLB **model** (auto-fit + center; error-boundary
  falls back to a cutout image, then a placeholder mesh). Per-piece `heroRotation`
  (beauty angle), `modelScale`, gentle **sway** (flat pieces hold still via
  `animate:false`); **hover** teases (scale + bloom), **focus** commits (bigger
  scale + bloom); other pieces `dim` while one is focused.

### The focus tool
Hover teases; **click / voice / keyboard commits** → the camera dollies to the
piece, `DepthOfField` blurs the neighbours, and a glass **focus card**
(`MinimalControls`) shows name · price · tagline + **Add to Bag** · **Ask Aurelis**
· **← Collection**. Exit via the click-away backdrop, **Esc**, or the card;
**← / →** navigate pieces. Visually-hidden per-piece buttons make it
keyboard/screen-reader reachable. Motion tokens (`HOVER`, `FOCUS`, `EASE`) in
`config/motion.ts`. `MicButton` also state-morphs (mic → emerald bars → orbiting
gold dots → sapphire bars + rings) under a rotating gilded halo.

### Products & assets
- `config/products.ts` — the flat `PRODUCTS[]` (6 pieces: Aurora Chronograph,
  Aurelis Connect, Cascade Diamond Necklace, Atelier Top Handle, Pearl Oud,
  Sculpted Sunglasses). Each: `{ id, name, priceLabel, tagline, accent, shape,
  cutout, model, heroRotation, modelScale, animate }`. `types/product.ts` holds
  the types; `PRODUCT_MAP`/`getProduct` for lookups.
- `public/models/products/*.glb` — one GLB per piece, **compressed** (meshopt +
  2K WebP). Load via drei `useGLTF` (meshopt/Draco decoders default-on).
- `cutout` fallbacks are Unsplash, shown only if a GLB fails. `AssetPreloader`
  warms GLBs + images on idle.

### Config
`config/{scenes,agent,products,demo-flows,motion,responsive,voice-intents}.ts`.
`scenes.ts` = `SCENES` + `SCENE_VIEWS`, `getSceneCamera`/`getSceneOrb`,
`BOUTIQUE_LAYOUT`, `getArcPosition` (shared by scene + focus camera), the
graded-down `atmosphere`. `responsive.ts` = `ViewMode` (desktop/landscape/portrait)
+ `QUALITY` (dpr cap 1.5; `reflections` off on portrait).

## 4. Notable decisions / fixes (so they aren't re-litigated)
- **Single-page restructure**: the old two-screen category model (Boutique Window
  → Luminous Atelier) + booking/lead/handoff flows were removed. One home page,
  flat products, select → checkout.
- **Checkout is a route, not a modal**: `/checkout` page; the voice layer lives in
  `GlobalChrome` so the agent keeps filling fields across the navigation.
- **Exposure grade**: the scene was blown-out/white. No renderer exposure knob
  works (composer forces `NoToneMapping`), so the *sources* were graded down —
  warmer atmosphere (`#fbf7f0` → `#ece2d2`), `environmentIntensity 0.82`, softer
  low-mirror floor, trimmed lights, warm off-white Lightformer. Measured highlight
  clipping ~0%.
- **Focus/DOF depends on tonal depth** — that's why the grade shipped with the
  focus tool.
- **Whole-page blink** = `EffectComposer multisampling={4}` black frames on
  Windows/ANGLE → `multisampling={0}` + `SMAA`. And the navigation blink = one
  shared `<Suspense>` unmounting the room → split so the room/orb persist.
- **Voice iterations**: coral → sage → shimmer → **marin** (newest, smoothest);
  speed settled at 1.08 (below 1.0 time-stretches and buzzes); persona dialed to
  warm + lightly flirty.
- **Piece presentation**: continuous 360° spin caught flat pieces edge-on → per
  piece `heroRotation` + gentle sway, flat pieces held still.
- **Performance** (visually invisible): GLB compression; DPR cap 1.5;
  reflector/shadow res 512; orb detail 10; `antialias:false` (SMAA does AA).

## 5. Known TODOs / not done
- **Placeholder GLBs** — the 6 models are generic (the "diamond necklace" is a
  bead strand). The focus/zoom shows them up close now, so **bespoke or
  brand-supplied hero models** are the highest-leverage next step (swap via
  `config/products.ts`). See the graphical audit in git history.
- **Real backends** are no-ops — `TODO(production)` in `lib/demo/demoActions.ts`.
- **Observability** — `lib/log.ts#reportError` console-logs only; wire Sentry.
- **Tests** cover pure logic (`lib/*`) via Vitest; no e2e/Playwright yet.
- **CI** runs typecheck → lint → test → build (`.github/workflows/ci.yml`).

## 6. Working style notes
- Verify (typecheck + lint + test + build + targeted headless probe) rather than
  guessing; report honestly when something can't be confirmed headless.
- Keep GLB/asset commits separate from code; the user manages model swaps.
- Commit/push **only when asked**. End commit messages with the project's
  `Co-Authored-By` line.
