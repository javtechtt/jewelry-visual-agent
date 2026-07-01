"use client";

// Warms the collection's assets in the background AFTER first paint, so the
// pieces don't pop in. Replaces drei's <Preload all/> (which forced everything
// to decode before first paint). This defers to idle instead.

import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { PRODUCTS } from "@/config/products";

export default function AssetPreloader() {
  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const schedule = win.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 800));
    const handle = schedule(() => {
      // GLB models shown on the boutique home page.
      PRODUCTS.forEach((p) => {
        if (p.model) useGLTF.preload(p.model);
      });
      // Cutout images — warm the HTTP cache so the fallback resolves instantly.
      const urls = new Set<string>();
      PRODUCTS.forEach((p) => {
        if (p.cutout) urls.add(p.cutout);
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
