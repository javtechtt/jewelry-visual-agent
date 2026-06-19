// Internet showcase imagery for the boutique.
//
// These are hot-linked Unsplash photos used as the product visuals on the glass
// panels — both the Boutique Window category heroes and the Luminous Atelier
// product options. They render as 2.5D textured planes via ProductObject's
// `cutout` path (see components/three/ProductObject.tsx), so the experience
// stays fully scene-first — no DOM cards.
//
// Unsplash serves these with `Access-Control-Allow-Origin: *`, so they upload
// cleanly as WebGL textures (drei's useTexture loads with crossOrigin
// "anonymous"). To use your own assets instead, drop transparent cutouts into
// public/products/<category>/ and swap the URLs below for local paths — see
// docs/ASSET_PIPELINE.md.

import type { CategoryId } from "@/types/category";

// Resize + modern-format params keep the textures light. `auto=format` serves
// WebP/AVIF where supported; `fit=crop` resizes without distortion.
const PARAMS = "w=800&q=80&auto=format&fit=crop";

const img = (id: string) => `https://images.unsplash.com/photo-${id}?${PARAMS}`;

/** Hero image per category — shown on the floating panels in the Boutique Window. */
export const CATEGORY_SHOWCASE: Record<CategoryId, string> = {
  watches: img("1523275335684-37898b6baf30"),
  jewelry: img("1605100804763-247f67b3557e"),
  bags: img("1584917865442-de89df76afd3"),
  fragrances: img("1541643600914-78b084683601"),
  accessories: img("1572635196237-14b3f281503f"),
  gifts: img("1549465220-1a8b9238cd48"),
  services: img("1521334884684-d80222895322"),
};

/**
 * Image per product option — shown orbiting the orb in the Luminous Atelier.
 * Keyed by the option id (`<category>-<n>`) built in config/category-options.ts.
 */
export const OPTION_SHOWCASE: Record<string, string> = {
  // Watches
  "watches-1": img("1524805444758-089113d48a6d"),
  "watches-2": img("1547996160-81dfa63595aa"),
  "watches-3": img("1612817159949-195b6eb9e31a"),
  "watches-4": img("1620625515032-6ed0c1790c75"),
  // Jewelry
  "jewelry-1": img("1515562141207-7a88fb7ce338"),
  "jewelry-2": img("1611652022419-a9419f74343d"),
  "jewelry-3": img("1599643478518-a784e5dc4c8f"),
  "jewelry-4": img("1535632066927-ab7c9ab60908"),
  // Bags
  "bags-1": img("1548036328-c9fa89d128fa"),
  "bags-2": img("1566150905458-1bf1fc113f0d"),
  "bags-3": img("1591561954557-26941169b49e"),
  "bags-4": img("1559563458-527698bf5295"),
  // Fragrances
  "fragrances-1": img("1592945403244-b3fbafd7f539"),
  "fragrances-2": img("1588405748880-12d1d2a59f75"),
  "fragrances-3": img("1594035910387-fea47794261f"),
  "fragrances-4": img("1523293182086-7651a899d37f"),
  // Accessories
  "accessories-1": img("1473496169904-658ba7c44d8a"),
  "accessories-2": img("1556306535-0f09a537f0a3"),
  "accessories-3": img("1511499767150-a48a237f0083"),
  "accessories-4": img("1572635196237-14b3f281503f"),
  // Gifts
  "gifts-1": img("1549465220-1a8b9238cd48"),
  "gifts-2": img("1607344645866-009c320b63e0"),
  "gifts-3": img("1513885535751-8b9238bd345a"),
  "gifts-4": img("1608755728617-aefab37d2edd"),
  // Services
  "services-1": img("1521334884684-d80222895322"),
  "services-2": img("1519125323398-675f0ddb6308"),
  "services-3": img("1542838132-92c53300491e"),
  "services-4": img("1519125323398-675f0ddb6308"),
};
