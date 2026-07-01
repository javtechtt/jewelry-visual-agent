"use client";

// Warms the cross-scene assets in the background AFTER first paint, so entering
// a category doesn't pop-in its products. Replaces drei's <Preload all/> (which
// only preloads the currently-mounted scene) — that was removed because it
// forced ~9.5MB to decode before first paint. This defers to idle instead.

import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { CATEGORIES } from "@/config/categories";
import { CATEGORY_OPTIONS } from "@/config/category-options";

export default function AssetPreloader() {
  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const schedule = win.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 800));
    const handle = schedule(() => {
      // GLB category models (shown in the boutique window).
      CATEGORIES.forEach((c) => {
        if (c.model) useGLTF.preload(c.model);
      });
      // Cutout images (categories + every option) — warm the HTTP cache so the
      // Atelier's textures resolve instantly on entry.
      const urls = new Set<string>();
      CATEGORIES.forEach((c) => {
        if (c.cutout) urls.add(c.cutout);
        CATEGORY_OPTIONS[c.id]?.forEach((o) => {
          if (o.cutout) urls.add(o.cutout);
        });
      });
      urls.forEach((u) => {
        const img = new Image();
        img.src = u;
      });
    });
    return () => {
      if (win.cancelIdleCallback && typeof handle === "number") win.cancelIdleCallback(handle);
    };
  }, []);

  return null;
}
