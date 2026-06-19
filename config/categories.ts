// Config-driven boutique categories. The Boutique Window scene reads this list
// to lay out floating category objects. Add/remove categories here — the scene,
// voice intents and controls all derive from it.

import type { Category, CategoryId } from "@/types/category";
import { CATEGORY_SHOWCASE } from "./showcase-images";

const CATEGORY_BASE: Category[] = [
  {
    id: "watches",
    label: "Watches",
    tagline: "Timeless mechanics, sculpted in light.",
    accent: { base: "#e9d8a6", glow: "#f4e3b0" },
    shape: "watch",
  },
  {
    id: "jewelry",
    label: "Jewelry",
    tagline: "Brilliance set by hand.",
    accent: { base: "#f3d9e4", glow: "#ffd9ec" },
    shape: "ring",
  },
  {
    id: "bags",
    label: "Bags",
    tagline: "Architecture you carry.",
    accent: { base: "#e7d3c1", glow: "#f0dcc6" },
    shape: "bag",
  },
  {
    id: "fragrances",
    label: "Fragrances",
    tagline: "An atmosphere, bottled.",
    accent: { base: "#d9e6e4", glow: "#e3f4ef" },
    shape: "bottle",
  },
  {
    id: "accessories",
    label: "Accessories",
    tagline: "The final, deliberate detail.",
    accent: { base: "#e2dce9", glow: "#ece2f4" },
    shape: "accessory",
  },
  {
    id: "gifts",
    label: "Gifts",
    tagline: "Occasions, beautifully wrapped.",
    accent: { base: "#f0d6cf", glow: "#fbe0d6" },
    shape: "giftbox",
  },
  {
    id: "services",
    label: "Services",
    tagline: "Your private concierge atelier.",
    accent: { base: "#dfe7f0", glow: "#e9f1fb" },
    shape: "concierge",
  },
];

// Attach the internet showcase hero image to each category. Rendered as a 2.5D
// textured plane on the floating glass panel — see config/showcase-images.ts.
export const CATEGORIES: Category[] = CATEGORY_BASE.map((category) => ({
  ...category,
  cutout: CATEGORY_SHOWCASE[category.id],
}));

export const CATEGORY_MAP: Record<CategoryId, Category> = CATEGORIES.reduce(
  (map, category) => {
    map[category.id] = category;
    return map;
  },
  {} as Record<CategoryId, Category>,
);

export function getCategory(id: CategoryId): Category {
  return CATEGORY_MAP[id];
}
