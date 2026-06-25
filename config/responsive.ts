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
}

// Render-quality trims (the camera + composition are untouched):
// - Reflection + contact-shadow render targets are 512 across all views. Both
//   are heavily blurred (reflection blur [420,110]/mixBlur 8; contact shadow
//   blur 2.8), so 512 is visually identical to 1024 while halving those passes.
// - DPR ceiling capped at 1.5. Pixel fill is the dominant cost on hi-DPI
//   displays; measured ~137fps @ 5.4MP vs ~74fps @ 12MP. 1.5 trims ~30% of
//   pixels vs 1.8 for a large framerate gain at a slight sharpness cost.
export const QUALITY: Record<ViewMode, QualityPreset> = {
  desktop: { dpr: [1, 1.5], reflectorResolution: 512, contactShadowResolution: 512 },
  landscape: { dpr: [1, 1.5], reflectorResolution: 512, contactShadowResolution: 512 },
  portrait: { dpr: [1, 1.5], reflectorResolution: 512, contactShadowResolution: 512 },
};
