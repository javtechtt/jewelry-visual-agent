"use client";

// The single experience root. The 3D canvas is the primary layer; every DOM
// element (brand, voice, controls, demo flows) is a thin overlay on top of it.
// Mounted client-only (see app/page.tsx) so WebGL never runs during SSR.

import { useLayoutEffect } from "react";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { useViewMode } from "@/lib/hooks/useViewMode";
import CanvasStage from "@/components/three/CanvasStage";
import BoutiqueWindowScene from "./BoutiqueWindowScene";
import VoiceController from "@/components/voice/VoiceController";
import MicButton from "@/components/voice/MicButton";
import VoiceStatusHint from "@/components/voice/VoiceStatusHint";
import TextFallback from "@/components/voice/TextFallback";
import AssetPreloader from "./AssetPreloader";
import BrandOverlay from "@/components/overlays/BrandOverlay";
import MinimalControls from "@/components/overlays/MinimalControls";
import CartOverlay from "@/components/overlays/CartOverlay";
import DemoCheckoutOverlay from "@/components/overlays/DemoCheckoutOverlay";

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

      {/* Voice logic + background asset warming (render nothing) */}
      <VoiceController />
      <AssetPreloader />

      {/* Minimal luxury overlays */}
      <BrandOverlay />
      <MicButton />
      <VoiceStatusHint />
      <MinimalControls />
      <CartOverlay />
      <TextFallback />

      {/* Demo-safe checkout (conditionally visible) */}
      <DemoCheckoutOverlay />
    </div>
  );
}
