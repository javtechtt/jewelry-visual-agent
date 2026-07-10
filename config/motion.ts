// Shared motion language for the DOM overlays (Framer Motion) and the 3D object
// tweens (hand-rolled lerps). Keep timings calm and premium — soft eases.

export const EASE = {
  // Cinematic ease-in-out used for camera moves + overlay reveals.
  cinematic: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

/** Hover bloom response for product objects — the "tease" state. */
export const HOVER = {
  scale: 1.14,
  emissiveBoost: 1.8,
};

/** Focus response — the "commit" state, a clear step beyond HOVER. The piece
 *  scales + blooms more, and the camera dollies in front of it. */
export const FOCUS = {
  scale: 1.3,
  emissiveBoost: 2.6,
  /** Camera: distance in front of the focused piece, and its field of view. */
  cameraDistance: 2.7,
  cameraFov: 32,
};
