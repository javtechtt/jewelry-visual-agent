// The boutique's hand-picked collection — the single source of truth for the
// home page. Each piece is a real 3D model (public/models/products/*.glb) with a
// showcase image fallback. The scene lays these out directly (no categories); the
// guest selects one and Aurelis takes them to checkout.
//
// To use your own art, drop a GLB into public/models/products/ and/or a cutout
// image into public/products/, then point `model` / `cutout` at it — the scene
// swaps the visual with no other changes. See docs/ASSET_PIPELINE.md.

import type { Product } from "@/types/product";

// Unsplash resize params keep the fallback textures light (WebP/AVIF where
// supported). A PORTRAIT crop (760×1000) matches the case footprint; the
// renderer cover-fits whatever's left so there's never empty space. Unsplash
// serves these with `Access-Control-Allow-Origin: *`, so they upload cleanly as
// WebGL textures. These are only the fallback if a GLB fails to load.
const PARAMS = "w=760&h=1000&q=80&auto=format&fit=crop";
const img = (id: string) => `https://images.unsplash.com/photo-${id}?${PARAMS}`;

export const PRODUCTS: Product[] = [
  {
    id: "aurora-chronograph",
    name: "Aurora Chronograph",
    priceLabel: "$12,400",
    tagline: "Timeless mechanics, sculpted in light.",
    accent: { base: "#e9d8a6", glow: "#f4e3b0" },
    shape: "watch",
    cutout: img("1523275335684-37898b6baf30"),
    model: "/models/products/watches.glb",
  },
  {
    id: "aurelis-connect",
    name: "Aurelis Connect",
    priceLabel: "$2,400",
    tagline: "The connected companion, quietly refined.",
    accent: { base: "#dfe3e8", glow: "#eef2f6" },
    shape: "watch",
    cutout: img("1547996160-81dfa63595aa"),
    model: "/models/products/apple-watche.glb",
  },
  {
    id: "cascade-necklace",
    name: "Cascade Diamond Necklace",
    priceLabel: "$42,500",
    tagline: "Brilliance set by hand.",
    accent: { base: "#f3d9e4", glow: "#ffd9ec" },
    shape: "ring",
    cutout: img("1605100804763-247f67b3557e"),
    model: "/models/products/jewelry.glb",
  },
  {
    id: "atelier-top-handle",
    name: "Atelier Top Handle",
    priceLabel: "$6,900",
    tagline: "Architecture you carry.",
    accent: { base: "#e7d3c1", glow: "#f0dcc6" },
    shape: "bag",
    cutout: img("1584917865442-de89df76afd3"),
    model: "/models/products/bags.glb",
  },
  {
    id: "pearl-oud",
    name: "Pearl Oud",
    priceLabel: "$420",
    tagline: "An atmosphere, bottled.",
    accent: { base: "#d9e6e4", glow: "#e3f4ef" },
    shape: "bottle",
    cutout: img("1541643600914-78b084683601"),
    model: "/models/products/fragrances.glb",
  },
  {
    id: "sculpted-sunglasses",
    name: "Sculpted Sunglasses",
    priceLabel: "$620",
    tagline: "The final, deliberate detail.",
    accent: { base: "#e2dce9", glow: "#ece2f4" },
    shape: "accessory",
    cutout: img("1572635196237-14b3f281503f"),
    model: "/models/products/accessories.glb",
  },
];

export const PRODUCT_MAP: Record<string, Product> = PRODUCTS.reduce(
  (map, product) => {
    map[product.id] = product;
    return map;
  },
  {} as Record<string, Product>,
);

export function getProduct(id: string): Product | undefined {
  return PRODUCT_MAP[id];
}
