// Product domain types for the Aurelis boutique.
// The boutique is a single showcase of hand-picked pieces (config/products.ts).
// The 3D scene reads these to lay out the floating pieces; the guest selects one
// and Aurelis takes them to checkout. There is no category layer.

/**
 * Shape hint for the placeholder mesh rendered by ProductObject when a real
 * asset (cutout image / GLB model) isn't available. Once a model or cutout is
 * supplied the renderer swaps the primitive out without touching the scene graph.
 */
export type ProductShape =
  | "watch"
  | "ring"
  | "bag"
  | "bottle"
  | "accessory";

/** Light-premium accent palette used for glow, rim light and material tint. */
export interface ProductAccent {
  /** Core surface tint (hex). */
  base: string;
  /** Emissive / bloom glow color (hex). */
  glow: string;
}

/** A single hand-picked piece shown on the boutique home page. */
export interface Product {
  id: string;
  /** Display name, e.g. "Aurora Chronograph". Used verbatim by the agent. */
  name: string;
  /** Display-only price label. No real pricing/checkout occurs. */
  priceLabel: string;
  /** One-line editorial tagline shown on hover / spoken by Aurelis. */
  tagline: string;
  accent: ProductAccent;
  /** Placeholder geometry used until a real asset loads. */
  shape: ProductShape;
  /** Optional cutout image path/URL — a 2.5D textured plane (GLB fallback). */
  cutout?: string;
  /** Optional GLB/GLTF model path under /public/models. */
  model?: string;
}
