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

// Desktop values mirror the original canvas/effects EXACTLY. Non-desktop trims
// only the GPU-heavy render targets (floor reflection + contact shadows) and the
// DPR ceiling for smoother handheld framerates — it never touches the look of
// the desktop scene or its post-processing.
export const QUALITY: Record<ViewMode, QualityPreset> = {
  desktop: { dpr: [1, 1.8], reflectorResolution: 1024, contactShadowResolution: 1024 },
  landscape: { dpr: [1, 1.6], reflectorResolution: 512, contactShadowResolution: 512 },
  portrait: { dpr: [1, 1.5], reflectorResolution: 512, contactShadowResolution: 512 },
};
