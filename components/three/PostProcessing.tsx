"use client";

// Cinematic finishing pass. Kept deliberately restrained for the light-premium
// look: a high-threshold bloom so only the emissive orb + bright rim highlights
// glow (the ivory environment must NOT bloom, or it veils the frame in haze), a
// soft vignette, and ACES Filmic tone mapping for richer, less washed-out colour
// (AgX desaturated the products too much).

import { Bloom, EffectComposer, Noise, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";

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
      {/* Deeper frame for cinematic richness (still light-premium, not moody). */}
      <Vignette eskil={false} offset={0.26} darkness={0.52} />
      {/* Fine film grain — reads as "expensive film", and breaks up the large
          flat ivory areas so they never look empty/washed-out. */}
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.045} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
