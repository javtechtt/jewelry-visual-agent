# Product cutouts

Per-category folders for **transparent PNG product cutouts** (or WebP). These
render as 2.5D textured planes inside the scene — a fast path to a product-rich
boutique without full 3D models.

```
products/
  watches/      jewelry/      bags/        fragrances/
  accessories/  gifts/        services/
```

To use a cutout, set the `cutout` field to its public path:

```ts
// config/category-options.ts
{ id: "watches-1", /* ... */ cutout: "/products/watches/aurora-chronograph.png" }
```

`components/three/ProductObject.tsx` will render the cutout instead of the
placeholder mesh. Recommended: ~1200×1500px, transparent background, soft
contact shadow baked in. See `docs/ASSET_PIPELINE.md`.
