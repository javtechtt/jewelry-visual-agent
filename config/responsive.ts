// Responsive view modes for the cinematic 3D experience.
//
// IMPORTANT: `desktop` is the approved composition and is NEVER altered. It is
// gated purely on viewport WIDTH so large screens always get the exact original
// camera/scene values. Below the desktop width we branch on ORIENTATION/aspect,
// because horizontal framing (perspective FOV is vertical) depends on the aspect
// ratio far more than on raw pixel width — a portrait phone and a landscape
// tablet of similar width need very different scene presets.
//
// The DOM overlay layer additionally uses CSS media queries (see globals.css);
// this module only governs the WebGL scene presets + render quality.

export type ViewMode = "desktop" | "landscape" | "portrait";

/** At/above this width the experience always uses the untouched desktop preset. */
export const DESKTOP_MIN_WIDTH = 1280;

export function getViewMode(width: number, height: number): ViewMode {
  if (width >= DESKTOP_MIN_WIDTH) return "desktop";
  return width >= height ? "landscape" : "portrait";
}

export interface QualityPreset {
  /** Canvas device-pixel-ratio clamp [min, max]. */
  dpr: [number, number];
  /** MeshReflectorMaterial render-target resolution. */
  reflectorResolution: number;
  /** ContactShadows render-target resolution. */
  contactShadowResolution: number;
  /** Whether the floor uses the (expensive) per-frame planar reflection. */
  reflections: boolean;
}

// Render-quality tiers. DESKTOP is the approved preset and is left UNTOUCHED
// (DPR 1.5, 512 render targets, reflections on). Handheld tiers trim the
// GPU-heavy passes so phones don't run a full reflective floor + 1.5x fill and
// thermal-throttle:
// - landscape (tablets / rotated phones): DPR 1.3, 256 render targets.
// - portrait (phones, tightest budget): DPR 1.2, 256 targets, and the planar
//   reflection is dropped for a flat floor (the single biggest per-frame cost).
export const QUALITY: Record<ViewMode, QualityPreset> = {
  desktop: { dpr: [1, 1.5], reflectorResolution: 512, contactShadowResolution: 512, reflections: true },
  landscape: { dpr: [1, 1.3], reflectorResolution: 256, contactShadowResolution: 256, reflections: true },
  portrait: { dpr: [1, 1.2], reflectorResolution: 256, contactShadowResolution: 256, reflections: false },
};
