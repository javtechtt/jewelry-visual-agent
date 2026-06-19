// Per-category product options shown orbiting the orb in the Luminous Atelier.
// Each option is wired to an internet showcase image (config/showcase-images.ts),
// rendered as a 2.5D textured plane. To use your own art instead, drop a cutout
// into public/products/<category>/<id>.png (or a GLB into public/models) and
// point `cutout` / `model` at it — see docs/ASSET_PIPELINE.md.

import type { CategoryId, CategoryOption } from "@/types/category";
import { CATEGORY_MAP } from "./categories";
import { OPTION_SHOWCASE } from "./showcase-images";

function accentFor(categoryId: CategoryId) {
  return CATEGORY_MAP[categoryId].accent;
}

function shapeFor(categoryId: CategoryId) {
  return CATEGORY_MAP[categoryId].shape;
}

/** Build 4 placeholder options for a category with sensible demo names/prices. */
function buildOptions(
  categoryId: CategoryId,
  entries: Array<{ name: string; priceLabel: string }>,
): CategoryOption[] {
  return entries.map((entry, index) => {
    const id = `${categoryId}-${index + 1}`;
    return {
      id,
      categoryId,
      name: entry.name,
      priceLabel: entry.priceLabel,
      shape: shapeFor(categoryId),
      accent: accentFor(categoryId),
      cutout: OPTION_SHOWCASE[id],
    };
  });
}

export const CATEGORY_OPTIONS: Record<CategoryId, CategoryOption[]> = {
  watches: buildOptions("watches", [
    { name: "Aurora Chronograph", priceLabel: "$12,400" },
    { name: "Lumen Skeleton", priceLabel: "$28,900" },
    { name: "Meridian Automatic", priceLabel: "$9,600" },
    { name: "Solstice Tourbillon", priceLabel: "$64,000" },
  ]),
  jewelry: buildOptions("jewelry", [
    { name: "Halo Solitaire Ring", priceLabel: "$18,200" },
    { name: "Cascade Diamond Necklace", priceLabel: "$42,500" },
    { name: "Lumière Tennis Bracelet", priceLabel: "$15,750" },
    { name: "Étoile Drop Earrings", priceLabel: "$11,300" },
  ]),
  bags: buildOptions("bags", [
    { name: "Atelier Top Handle", priceLabel: "$6,900" },
    { name: "Monolith Tote", priceLabel: "$4,300" },
    { name: "Saffiano Clutch", priceLabel: "$2,850" },
    { name: "Voyage Weekender", priceLabel: "$8,100" },
  ]),
  fragrances: buildOptions("fragrances", [
    { name: "Pearl Oud", priceLabel: "$420" },
    { name: "Ivory Neroli", priceLabel: "$310" },
    { name: "Champagne Musk", priceLabel: "$365" },
    { name: "Atelier No. 7", priceLabel: "$540" },
  ]),
  accessories: buildOptions("accessories", [
    { name: "Silk Carré Scarf", priceLabel: "$540" },
    { name: "Onyx Cufflinks", priceLabel: "$890" },
    { name: "Sculpted Sunglasses", priceLabel: "$620" },
    { name: "Leather Card Holder", priceLabel: "$390" },
  ]),
  gifts: buildOptions("gifts", [
    { name: "Signature Gift Suite", priceLabel: "$1,200" },
    { name: "Celebration Coffret", priceLabel: "$740" },
    { name: "Bespoke Engraving Set", priceLabel: "$980" },
    { name: "Seasonal Atelier Box", priceLabel: "$520" },
  ]),
  services: buildOptions("services", [
    { name: "Private Appointment", priceLabel: "Complimentary" },
    { name: "Bespoke Commission", priceLabel: "By consultation" },
    { name: "Care & Restoration", priceLabel: "From $180" },
    { name: "Personal Styling", priceLabel: "Complimentary" },
  ]),
};

export function getCategoryOptions(categoryId: CategoryId): CategoryOption[] {
  return CATEGORY_OPTIONS[categoryId] ?? [];
}
