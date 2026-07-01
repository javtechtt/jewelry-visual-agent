// Shared motion language for the DOM overlays (Framer Motion) and the 3D object
// tweens (hand-rolled lerps). Keep timings calm and premium — soft eases.

export const EASE = {
  // Cinematic ease-in-out used for camera moves + overlay reveals.
  cinematic: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

/** Hover/focus bloom response for product objects. */
export const HOVER = {
  scale: 1.14,
  emissiveBoost: 1.8,
};
