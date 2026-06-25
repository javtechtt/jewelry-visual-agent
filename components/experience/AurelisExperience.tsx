"use client";

// The single experience root. The 3D canvas is the primary layer; every DOM
// element (brand, voice, controls, demo flows) is a thin overlay on top of it.
// Mounted client-only (see app/page.tsx) so WebGL never runs during SSR.

import { useLayoutEffect } from "react";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { useViewMode } from "@/lib/hooks/useViewMode";
import CanvasStage from "@/components/three/CanvasStage";
import BoutiqueWindowScene from "./BoutiqueWindowScene";
import LuminousAtelierScene from "./LuminousAtelierScene";
import SceneTransition from "./SceneTransition";
import VoiceController from "@/components/voice/VoiceController";
import MicButton from "@/components/voice/MicButton";
import TextFallback from "@/components/voice/TextFallback";
import BrandOverlay from "@/components/overlays/BrandOverlay";
import MinimalControls from "@/components/overlays/MinimalControls";
import CartOverlay from "@/components/overlays/CartOverlay";
import DemoCheckoutOverlay from "@/components/overlays/DemoCheckoutOverlay";
import DemoBookingOverlay from "@/components/overlays/DemoBookingOverlay";
import LeadCaptureOverlay from "@/components/overlays/LeadCaptureOverlay";
import HandoffOverlay from "@/components/overlays/HandoffOverlay";

export default function AurelisExperience() {
  const scene = useExperienceStore((s) => s.scene);

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
      {/* Scene-first layer */}
      <CanvasStage view={view}>
        {scene === "boutique-window" ? <BoutiqueWindowScene /> : <LuminousAtelierScene />}
      </CanvasStage>

      {/* Voice logic (renders nothing) */}
      <VoiceController />

      {/* Minimal luxury overlays */}
      <BrandOverlay />
      <MicButton />
      <MinimalControls />
      <CartOverlay />
      <TextFallback />
      <SceneTransition />

      {/* Demo-safe flows (conditionally visible) */}
      <DemoCheckoutOverlay />
      <DemoBookingOverlay />
      <LeadCaptureOverlay />
      <HandoffOverlay />
    </div>
  );
}
