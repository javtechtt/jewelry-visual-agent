"use client";

// Cinematic finishing pass. Kept deliberately restrained for the light-premium
// look: a high-threshold bloom so only the emissive orb + bright rim highlights
// glow (the ivory environment must NOT bloom, or it veils the frame in haze), a
// soft vignette + fine grain for tonal depth, and ACES Filmic tone mapping.
//
// DepthOfField stays MOUNTED and its bokeh is animated up only while a piece is
// focused (toggling an effect in/out of the composer forces a shader recompile
// and hitches). It autofocuses on the focused piece via `target`, throwing the
// rest of the scene soft. Portrait never dollies to focus, so its bokeh simply
// stays at 0 (no blur) there.

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Noise,
  SMAA,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import type { DepthOfFieldEffect } from "postprocessing";
import * as THREE from "three";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { BOUTIQUE_LAYOUT, getArcPosition } from "@/config/scenes";
import { PRODUCTS } from "@/config/products";

export default function PostProcessing() {
  const view = useExperienceStore((s) => s.view);
  const selectedId = useExperienceStore((s) => s.selectedProduct?.id);
  const reduced = useReducedMotion();
  const dofRef = useRef<DepthOfFieldEffect>(null);
  const focusTarget = useMemo(() => new THREE.Vector3(0, 0.4, 0), []);

  useFrame((_, delta) => {
    const dof = dofRef.current;
    if (!dof) return;
    const idx =
      selectedId && view !== "portrait" ? PRODUCTS.findIndex((p) => p.id === selectedId) : -1;
    const focused = idx >= 0;
    if (focused) {
      const pos = getArcPosition(idx, PRODUCTS.length, BOUTIQUE_LAYOUT[view]);
      focusTarget.set(pos[0], pos[1] + 0.32, pos[2]);
    }
    // Ramp the blur in/out (~0.5s) — reduced motion keeps it crisp.
    const want = focused && !reduced ? (view === "landscape" ? 1.6 : 2.6) : 0;
    const k = 1 - Math.pow(0.05, delta);
    dof.bokehScale = THREE.MathUtils.lerp(dof.bokehScale, want, k);
  });

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
      <DepthOfField ref={dofRef} target={focusTarget} focalLength={0.02} bokehScale={0} />

      {/* Deeper frame for cinematic richness (still light-premium, not moody). */}
      <Vignette eskil={false} offset={0.26} darkness={0.52} />
      {/* Fine film grain — reads as "expensive film", and breaks up the large
          flat ivory areas so they never look empty/washed-out. */}
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.045} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
