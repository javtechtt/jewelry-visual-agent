"use client";

// Cinematic finishing pass. Kept deliberately restrained for the light-premium
// look: a high-threshold bloom so only the emissive orb + bright rim highlights
// glow (the ivory environment stays clean), a soft vignette, and AgX tone
// mapping for refined, non-crushed highlights.

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
        intensity={0.92}
        luminanceThreshold={1.0}
        luminanceSmoothing={0.25}
        mipmapBlur
        radius={0.82}
      />
      <Vignette eskil={false} offset={0.3} darkness={0.4} />
      <ToneMapping mode={ToneMappingMode.AGX} />
    </EffectComposer>
  );
}
