// Category domain types for the Aurelis boutique experience.
// Categories are config-driven (see config/categories.ts). The 3D scene reads
// these to lay out floating category objects in the Boutique Window.

export type CategoryId =
  | "watches"
  | "jewelry"
  | "bags"
  | "fragrances"
  | "accessories"
  | "gifts"
  | "services";

/**
 * Shape hint for the placeholder product mesh rendered by ProductObject.
 * Once a real cutout image (public/products/<category>/*.png) or a GLB model
 * (public/models/*.glb) is supplied, the renderer can swap the primitive out
 * without touching the scene graph.
 */
export type ProductShape =
  | "watch"
  | "ring"
  | "bag"
  | "bottle"
  | "accessory"
  | "giftbox"
  | "concierge";

/** Light-premium accent palette used for glow, rim light and panel tint. */
export interface CategoryAccent {
  /** Core surface tint (hex). */
  base: string;
  /** Emissive / bloom glow color (hex). */
  glow: string;
}

export interface Category {
  id: CategoryId;
  /** Short luxury label, e.g. "Watches". */
  label: string;
  /** One-line editorial tagline shown minimally / spoken by Aurelis. */
  tagline: string;
  accent: CategoryAccent;
  /** Placeholder geometry used until a real asset is dropped in. */
  shape: ProductShape;
  /**
   * Optional real cutout image path under /public. When present the scene can
   * render a 2.5D textured plane instead of the primitive placeholder.
   */
  cutout?: string;
  /** Optional GLB/GLTF model path under /public/models. */
  model?: string;
}

/** A selectable product option shown orbiting the orb in the Luminous Atelier. */
export interface CategoryOption {
  id: string;
  categoryId: CategoryId;
  name: string;
  /** Display-only price label. No real pricing/checkout occurs. */
  priceLabel: string;
  shape: ProductShape;
  accent: CategoryAccent;
  cutout?: string;
  model?: string;
}
