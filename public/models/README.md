# 3D Models (GLB / GLTF)

Place real product models here as `.glb` (preferred) or `.gltf`.

To use a model for a category or product option, set the `model` field to its
public path (served from `/models/...`):

```ts
// config/categories.ts  or  config/category-options.ts
{ id: "watches", /* ... */ model: "/models/aurora-chronograph.glb" }
```

`components/three/ProductObject.tsx` loads it with drei's `useGLTF` and renders
it in place of the placeholder mesh — no other changes required.

Guidelines:

- Keep models lightweight (draco-compressed `.glb`, < ~3 MB each).
- Center the model at the origin and scale it to roughly a 0.8–1.0 unit height
  so it sits correctly on the glass plinths.
- Bake/clean materials for a light studio environment (PBR, low roughness for
  metals/glass).

See `docs/ASSET_PIPELINE.md` for the full pipeline.
