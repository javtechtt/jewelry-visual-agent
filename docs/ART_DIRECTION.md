# Art Direction — Aurelis

> A cinematic, AI-first luxury boutique. The site should feel like a futuristic
> luxury showroom controlled by an AI concierge — **not** a website with a
> chatbot bolted on.

## The one rule

**Scene first, UI second.** The primary visual layer is a Three.js / React Three
Fiber canvas. Every DOM element (brand, mic, captions, controls, demo flows) is
a thin, minimal overlay floating above the 3D world. If a decision trades scene
quality for UI chrome, the scene wins.

## Aesthetic target

Light. Premium. Futuristic. Warm.

- **Palette:** ivory, pearl white, warm sand, champagne gold, soft marble.
  Accent glows are pale and category-specific. No heavy blacks, no cyberpunk.
- **Light:** soft directional key + cool fill + a procedural studio environment
  (Lightformers) for gentle reflections. Bloom is restrained — only the orb and
  bright highlights glow; the ivory room stays clean.
- **Materials:** frosted glass panels, polished metals, clear glass, marble
  floor with subtle reflection. Clearcoat and low roughness on hero pieces.
- **Type:** an editorial serif (Cormorant Garamond) for the brand + scene
  titles; a clean sans (Geist) for controls. Generous letter-spacing, minimal
  copy.
- **Motion:** slow product float, a cinematic camera dolly between scenes, a
  luminous bloom wipe on transition, gentle hover bloom. Nothing bouncy or fast.

## The two screens

### Screen 1 — Boutique Window

- Fullscreen, 100vh, no scroll.
- The seven categories float in a gentle arc as glass-panelled product displays.
- Aurelis (the orb) is present but secondary; product/category objects lead.
- Minimal text; the category label sits under each floating object.
- The guest clicks a category (or says "show watches") to enter the Atelier.

### Screen 2 — Luminous Atelier

- The orb grows and becomes central.
- The selected category's product options orbit the orb on glass plinths.
- Hover/focus blooms a piece (scale + glow); others soften into depth.
- A back-to-boutique control returns via a camera move, not a page nav.

## What to avoid

- HTML cards, SVG icon tiles, flat beige `div`s, generic ecommerce grids.
- A chatbot widget or a dashboard layout.
- A dark orb demo with no products.
- Long paragraphs or always-visible helper text. Demo-safe explanations appear
  only inside the checkout/booking/lead/handoff flows.

## Voice-first

The mic is the primary control, pinned bottom-center. Captions are short. The
text fallback is hidden behind an icon. The interface should read as *guided by
an intelligent concierge* — the orb reacts (brightens/pulses) as Aurelis listens
and speaks.

## Where this is implemented

- Scene + atmosphere: `components/three/EnvironmentStage.tsx`, `LightRig.tsx`,
  `PostProcessing.tsx`.
- Orb: `components/three/AgentOrb.tsx`.
- Category objects + product placeholders: `FloatingCategoryObject.tsx`,
  `ProductObject.tsx`, `ProductDisplayPanel.tsx`.
- Scenes + camera + transition: `components/experience/*`.
- Palette + motion tokens: `config/categories.ts`, `config/motion.ts`,
  `config/scenes.ts`, and `app/globals.css`.
