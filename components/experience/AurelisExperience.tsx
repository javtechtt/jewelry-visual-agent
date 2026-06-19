"use client";

// The single experience root. The 3D canvas is the primary layer; every DOM
// element (brand, voice, controls, demo flows) is a thin overlay on top of it.
// Mounted client-only (see app/page.tsx) so WebGL never runs during SSR.

import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import CanvasStage from "@/components/three/CanvasStage";
import BoutiqueWindowScene from "./BoutiqueWindowScene";
import LuminousAtelierScene from "./LuminousAtelierScene";
import SceneTransition from "./SceneTransition";
import VoiceController from "@/components/voice/VoiceController";
import MicButton from "@/components/voice/MicButton";
import VoiceCaption from "@/components/voice/VoiceCaption";
import RealtimeStatus from "@/components/voice/RealtimeStatus";
import TextFallback from "@/components/voice/TextFallback";
import BrandOverlay from "@/components/overlays/BrandOverlay";
import MinimalControls from "@/components/overlays/MinimalControls";
import DemoCheckoutOverlay from "@/components/overlays/DemoCheckoutOverlay";
import DemoBookingOverlay from "@/components/overlays/DemoBookingOverlay";
import LeadCaptureOverlay from "@/components/overlays/LeadCaptureOverlay";
import HandoffOverlay from "@/components/overlays/HandoffOverlay";

export default function AurelisExperience() {
  const scene = useExperienceStore((s) => s.scene);

  return (
    <div className="experience-root">
      {/* Scene-first layer */}
      <CanvasStage>
        {scene === "boutique-window" ? <BoutiqueWindowScene /> : <LuminousAtelierScene />}
      </CanvasStage>

      {/* Voice logic (renders nothing) */}
      <VoiceController />

      {/* Minimal luxury overlays */}
      <BrandOverlay />
      <RealtimeStatus />
      <VoiceCaption />
      <MicButton />
      <MinimalControls />
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
