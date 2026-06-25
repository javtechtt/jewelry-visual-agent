"use client";

// Cinematic finishing pass. Kept deliberately restrained for the light-premium
// look: a high-threshold bloom so only the emissive orb + bright rim highlights
// glow (the ivory environment must NOT bloom, or it veils the frame in haze), a
// soft vignette, and ACES Filmic tone mapping for richer, less washed-out colour
// (AgX desaturated the products too much).

import { Bloom, EffectComposer, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

export default function PostProcessing() {
  // multisampling={0} is REQUIRED: MSAA on the composer's render targets emits a
  // black frame every other render under Windows/ANGLE, blinking the whole page.
  // SMAA restores edge antialiasing as a post pass (no multisampled target).
  return (
    <EffectComposer multisampling={0}>
      <SMAA />
      <Bloom
        intensity={0.85}
        luminanceThreshold={1.1}
        luminanceSmoothing={0.08}
        mipmapBlur
        radius={0.8}
      />
      <Vignette eskil={false} offset={0.3} darkness={0.4} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
