"use client";

// The R3F root. This is the scene-FIRST layer — everything visual lives inside
// this canvas; DOM overlays sit on top of it. The canvas is transparent so the
// light-premium CSS gradient backdrop shows through (see globals.css).

import { Canvas } from "@react-three/fiber";
import { Suspense, type ReactNode } from "react";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { SCENES } from "@/config/scenes";
import EnvironmentStage from "./EnvironmentStage";
import CursorFloorGlow from "./CursorFloorGlow";
import LightRig from "./LightRig";
import PostProcessing from "./PostProcessing";
import SceneCamera from "@/components/experience/SceneCamera";

export default function CanvasStage({ children }: { children: ReactNode }) {
  const initial = SCENES["boutique-window"].camera;

  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
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
