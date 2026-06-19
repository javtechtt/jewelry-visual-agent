// Shared motion language for GSAP (3D camera/object tweens) and Framer Motion
// (DOM overlays). Keep timings calm and premium — slow floats, soft eases.

export const EASE = {
  // Cinematic ease-in-out used for camera moves + overlay reveals.
  cinematic: [0.22, 1, 0.36, 1] as [number, number, number, number],
  soft: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

/** GSAP-friendly string easings. */
export const GSAP_EASE = {
  camera: "power3.inOut",
  object: "power2.out",
  bloom: "sine.inOut",
};

export const DURATION = {
  sceneTransition: 1.5,
  cameraMove: 1.6,
  overlay: 0.55,
  hover: 0.4,
  caption: 0.5,
};

/** Idle float parameters for floating product/category objects. */
export const FLOAT = {
  speed: 1.1,
  rotationIntensity: 0.35,
  floatIntensity: 0.55,
  /** Vertical bob amplitude in world units. */
  amplitude: 0.06,
};

/** Hover/focus bloom response for product objects. */
export const HOVER = {
  scale: 1.14,
  emissiveBoost: 1.8,
  /** Non-hovered siblings soften toward this opacity to create focus depth. */
  softenOpacity: 0.55,
};
