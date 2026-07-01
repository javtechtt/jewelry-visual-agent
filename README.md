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

- **Screen 1 — Boutique Window:** five categories (Watches, Jewelry, Bags,
  Fragrances, Accessories) presented in a 100vh no-scroll scene — a horizontal
  arc on desktop/tablet, and a swipeable single-hero carousel on phones — with
  the Aurelis orb present.
- **Screen 2 — Luminous Atelier:** tap a category (or say "show watches") and the
  camera dollies in; the orb sits central and the product options orbit it with
  hover/tap-to-focus interactions.
- **Voice-first controls:** mic (bottom-center), a hidden text fallback, a
  category rail, and demo action buttons. Live voice uses OpenAI Realtime; with
  no key it degrades to browser speech / text.
- **Demo-safe flows:** Checkout, Booking (live calendar), Stay-in-Touch, and
  Concierge handoff — real-feeling, with no real backend actions.

## Project structure

```
app/                     # Next App Router + /api/realtime-session route
components/
  experience/            # AurelisExperience, scenes, camera, transition
  three/                 # Canvas, orb, panels, products, lights, postprocessing
  voice/                 # mic, caption, text fallback, status, controller
  overlays/              # brand, controls, demo-safe flow overlays
config/                  # categories, options, scenes, motion, agent, intents
lib/
  realtime/              # OpenAI Realtime session + client + fallback
  demo/                  # demo-safe actions, receipts, validation
  stores/                # Zustand experience store
types/                   # shared domain types
public/                  # references, products/<category>, models, textures
docs/                    # art direction, asset pipeline, demo rules, realtime
```

## Adding real assets

Drop product cutouts into `public/products/<category>/`, GLB models into
`public/models/`, and point a `config/*` entry at them. The scene swaps the
placeholder automatically — see [`docs/ASSET_PIPELINE.md`](docs/ASSET_PIPELINE.md).

## Docs

- [Art Direction](docs/ART_DIRECTION.md)
- [Asset Pipeline](docs/ASSET_PIPELINE.md)
- [Demo-Safe Rules](docs/DEMO_SAFE_RULES.md)
- [OpenAI Realtime Setup](docs/OPENAI_REALTIME_SETUP.md)
