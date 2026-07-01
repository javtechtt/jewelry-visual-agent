# Aurelis — Cinematic AI Boutique

A cinematic, AI-first, voice-controlled **luxury boutique experience**. The main
screen is a **3D / 2.5D scene** (React Three Fiber) — a futuristic showroom
guided by the **Aurelis** AI concierge — with minimal luxury UI overlays on top.
Not a chatbot, not an ecommerce grid, not a card layout.

> Scene first. UI second. Voice-led. Demo-safe.

## Stack

Next.js 16 · React 19 · TypeScript · React Three Fiber · Three.js ·
@react-three/drei · @react-three/postprocessing · Framer Motion ·
Zustand · Tailwind CSS · OpenAI Realtime-ready (`gpt-realtime-2`).
Tooling: Vitest (unit) · ESLint (flat config) · GitHub Actions CI.

## Quick start

```bash
npm install          # if not already installed
cp .env.example .env.local   # optional — enables live OpenAI Realtime voice
npm run dev          # http://localhost:3000
```

The app runs with **no configuration**. Without an `OPENAI_API_KEY` it uses a
graceful browser-speech / text fallback for voice. See
[`docs/OPENAI_REALTIME_SETUP.md`](docs/OPENAI_REALTIME_SETUP.md).

Scripts: `npm run dev` · `npm run build` · `npm run start` · `npm run lint` ·
`npm run test` · `npm run typecheck`.

## What you'll see

- **One boutique home page:** the hand-picked collection (Aurora Chronograph,
  Aurelis Connect, Cascade Diamond Necklace, Atelier Top Handle, Pearl Oud,
  Sculpted Sunglasses) in a 100vh no-scroll 3D scene — a horizontal arc on
  desktop/tablet, a swipeable single-hero carousel on phones — with the Aurelis
  orb present. No categories, no second screen.
- **Select → checkout:** tap a piece (or say "I'll take the Cascade Necklace") to
  focus it, add it to your bag, and Aurelis guides you through checkout.
- **Voice-first controls:** mic (bottom-center), a hidden text fallback, an
  Add-to-Bag chip, and a Checkout button. Live voice uses OpenAI Realtime; with no
  key it degrades to browser speech / text.
- **Demo-safe checkout:** a real-feeling three-screen flow (details → payment →
  confirmation) with no real backend actions; card data is local-only.

## Project structure

```
app/                     # Next App Router + /api/realtime-session route
components/
  experience/            # AurelisExperience, boutique scene, camera, preloader
  three/                 # Canvas, orb, floating pieces, products, lights, postprocessing
  voice/                 # mic, caption, text fallback, status, controller
  overlays/              # brand, controls, cart, checkout
config/                  # products, scenes, motion, agent, voice-intents, demo-flows
lib/
  realtime/              # OpenAI Realtime session + client + fallback
  demo/                  # demo-safe actions, receipts, validation
  stores/                # Zustand experience store
types/                   # shared domain types (product, experience, demo, voice)
public/                  # models/products/*.glb, textures, references
docs/                    # art direction, asset pipeline, demo rules, realtime
```

## Adding real assets

Drop a GLB into `public/models/products/` (and/or a cutout image into
`public/products/`), then add or point a `config/products.ts` entry at it. The
scene swaps the visual automatically — see
[`docs/ASSET_PIPELINE.md`](docs/ASSET_PIPELINE.md).

## Docs

- [Art Direction](docs/ART_DIRECTION.md)
- [Asset Pipeline](docs/ASSET_PIPELINE.md)
- [Demo-Safe Rules](docs/DEMO_SAFE_RULES.md)
- [OpenAI Realtime Setup](docs/OPENAI_REALTIME_SETUP.md)
