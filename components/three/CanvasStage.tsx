"use client";

// The R3F root. This is the scene-FIRST layer — everything visual lives inside
// this canvas; DOM overlays sit on top of it. The canvas is transparent so the
// light-premium CSS gradient backdrop shows through (see globals.css).

import { Canvas } from "@react-three/fiber";
import { Suspense, type ReactNode } from "react";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { getSceneCamera } from "@/config/scenes";
import { QUALITY, type ViewMode } from "@/config/responsive";
import EnvironmentStage from "./EnvironmentStage";
import CursorFloorGlow from "./CursorFloorGlow";
import LightRig from "./LightRig";
import PostProcessing from "./PostProcessing";
import SceneCamera from "@/components/experience/SceneCamera";

export default function CanvasStage({
  children,
  view = "desktop",
}: {
  children: ReactNode;
  view?: ViewMode;
}) {
  // Start the camera + DPR at the correct responsive preset so the first frame
  // is already framed for the device (SceneCamera then keeps it settled).
  const initial = getSceneCamera("boutique-window", view);

  return (
    <Canvas
      shadows
      dpr={QUALITY[view].dpr}
      // antialias:false — the EffectComposer renders to its own targets and does
      // AA via SMAA, so the canvas's multisampled backbuffer is pure waste.
      gl={{ antialias: false, powerPreference: "high-performance" }}
      camera={{ position: initial.position, fov: initial.fov, near: 0.1, far: 100 }}
    >
      <SceneCamera />
      <LightRig />
      <Suspense fallback={null}>
        <EnvironmentStage />
        <CursorFloorGlow />
        {children}
        <Preload all />
      </Suspense>
      <PostProcessing />
      <AdaptiveDpr />
    </Canvas>
  );
}
