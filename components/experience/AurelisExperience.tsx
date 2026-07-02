"use client";

// The boutique home page. The 3D canvas is the primary layer; the cart + minimal
// controls sit on top. The voice agent, mic, brand mark, and checkout navigator
// live in GlobalChrome (app/layout.tsx) so they persist across the route into
// /checkout. Mounted client-only (see app/page.tsx) so WebGL never runs in SSR.

import { useLayoutEffect } from "react";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { useViewMode } from "@/lib/hooks/useViewMode";
import CanvasStage from "@/components/three/CanvasStage";
import BoutiqueWindowScene from "./BoutiqueWindowScene";
import AssetPreloader from "./AssetPreloader";
import MinimalControls from "@/components/overlays/MinimalControls";
import CartOverlay from "@/components/overlays/CartOverlay";

export default function AurelisExperience() {
  // Resolve the responsive view (desktop / landscape / portrait) and publish it
  // to the store so the in-canvas components read a single source of truth.
  // useLayoutEffect runs before the WebGL render loop's first frame, so the
  // scene is framed correctly from the start with no desktop→mobile flash.
  const view = useViewMode();
  const setView = useExperienceStore((s) => s.setView);
  useLayoutEffect(() => {
    setView(view);
  }, [view, setView]);

  return (
    <div className="experience-root">
      {/* Scene-first layer — the single boutique home page */}
      <CanvasStage view={view}>
        <BoutiqueWindowScene />
      </CanvasStage>

      {/* Background asset warming (renders nothing) */}
      <AssetPreloader />

      {/* Boutique-only overlays (brand + mic + voice are global; see GlobalChrome) */}
      <MinimalControls />
      <CartOverlay />
    </div>
  );
}
