# Asset Pipeline

The starter ships with **placeholder geometry** so it runs with zero assets.
Real assets drop into `/public` and are wired through config — no scene code
changes required.

## Three ways to render a product

`components/three/ProductObject.tsx` picks, in priority order:

1. **GLB/GLTF model** — if a `model` path is set → rendered with `useGLTF`.
2. **2.5D cutout** — else if a `cutout` path is set → rendered as a textured,
   transparent plane.
3. **Placeholder mesh** — else a premium primitive chosen by the category
   `shape` (`watch`, `ring`, `bag`, `bottle`, `accessory`, `giftbox`,
   `concierge`).

## Folders

```
public/
  references/   # design source-of-truth (NOT loaded by the app)
  products/     # transparent PNG/WebP cutouts, per category
    watches/ jewelry/ bags/ fragrances/ accessories/ gifts/ services/
  models/       # .glb / .gltf product models
  textures/     # optional material maps / gradients / labels
```

## Adding a 2.5D cutout (fastest path)

1. Export a transparent PNG (~1200×1500px, soft baked contact shadow).
2. Save it to `public/products/<category>/<name>.png`.
3. Point a config entry at it:

```ts
// config/category-options.ts
{ id: "watches-1", categoryId: "watches", name: "Aurora Chronograph",
  priceLabel: "$12,400", shape: "watch",
  cutout: "/products/watches/aurora-chronograph.png" }
```

(For the Boutique Window category objects, set `cutout` on the entry in
`config/categories.ts` instead.)

## Adding a GLB model

1. Export/optimize a draco-compressed `.glb` (< ~3 MB), centered at the origin,
   ~0.8–1.0 units tall, PBR materials tuned for a light studio.
2. Save it to `public/models/<name>.glb`.
3. Set `model: "/models/<name>.glb"` on the category or option.

> Tip: for many models, consider `useGLTF.preload("/models/<name>.glb")` and
> draco/meshopt decoders. The starter loads models lazily inside `<Suspense>`
> with the placeholder mesh as the fallback.

## Textures

Optional. Reference via `/textures/<file>` with drei's `useTexture`. The
environment is procedural by default, so textures are purely additive.

## Replacing placeholders globally

The placeholder shapes live in `ProductObject.tsx` (`ShapeMesh`). You can refine
them, or rely entirely on cutouts/models as assets arrive. Layout, lighting, and
interactions are independent of which render path is used.
