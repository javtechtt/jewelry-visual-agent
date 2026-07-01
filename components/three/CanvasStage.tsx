"use client";

// The R3F root. This is the scene-FIRST layer — everything visual lives inside
// this canvas; DOM overlays sit on top of it. Guards against no-WebGL machines
// and GPU context loss with a branded fallback rather than a blank screen.

import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { getSceneCamera } from "@/config/scenes";
import { QUALITY, type ViewMode } from "@/config/responsive";
import { isWebGLAvailable } from "@/lib/webgl";
import EnvironmentStage from "./EnvironmentStage";
import CursorFloorGlow from "./CursorFloorGlow";
import AgentOrb from "./AgentOrb";
import LightRig from "./LightRig";
import PostProcessing from "./PostProcessing";
import SceneCamera from "@/components/experience/SceneCamera";

function SceneFallback({ message, onReload }: { message: string; onReload?: () => void }) {
  return (
    <div className="scene-fallback">
      <p className="scene-fallback__brand">AURELIS</p>
      <p className="scene-fallback__msg">{message}</p>
      {onReload && (
        <button type="button" className="action-btn action-btn--accent" onClick={onReload}>
          Reload
        </button>
      )}
    </div>
  );
}

/** Pauses the render loop while the tab is hidden so the always-on scene doesn't
 *  keep burning GPU/battery in the background (it resumes on return). */
function FrameloopManager() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        setFrameloop("never");
      } else {
        setFrameloop("always");
        invalidate();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [setFrameloop, invalidate]);
  return null;
}

/** Attaches WebGL context-loss listeners so a GPU hiccup shows a recovery prompt
 *  instead of a silently frozen scene. */
function ContextLossGuard({ onLost, onRestored }: { onLost: () => void; onRestored: () => void }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (e: Event) => {
      e.preventDefault(); // let the browser attempt a restore
      onLost();
    };
    canvas.addEventListener("webglcontextlost", handleLost as EventListener);
    canvas.addEventListener("webglcontextrestored", onRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", handleLost as EventListener);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  }, [gl, onLost, onRestored]);
  return null;
}

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
  const [supported] = useState(() => isWebGLAvailable());
  const [contextLost, setContextLost] = useState(false);
  // Bumped on context-restore to force a clean Canvas remount (R3F doesn't
  // re-init the renderer on `webglcontextrestored` by itself).
  const [gen, setGen] = useState(0);
  const onLost = useCallback(() => setContextLost(true), []);
  const onRestored = useCallback(() => {
    setContextLost(false);
    setGen((g) => g + 1);
  }, []);

  if (!supported) {
    return <SceneFallback message="This experience needs a modern browser with graphics (WebGL) enabled." />;
  }

  return (
    <>
      <Canvas
        key={gen}
        shadows
        dpr={QUALITY[view].dpr}
        // antialias:false — the EffectComposer renders to its own targets and does
        // AA via SMAA, so the canvas's multisampled backbuffer is pure waste.
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{ position: initial.position, fov: initial.fov, near: 0.1, far: 100 }}
      >
        <SceneCamera />
        <LightRig />
        {/* The persistent room + concierge orb live in their OWN Suspense, kept
            separate from the scene below. The pieces suspend while their GLBs
            load; if the room shared that boundary it would unmount to black for
            ~1s (the "blink"). Split so only the pieces suspend — the room/orb
            never vanish. */}
        <Suspense fallback={null}>
          <EnvironmentStage />
          <CursorFloorGlow />
          <AgentOrb />
        </Suspense>
        <Suspense fallback={null}>{children}</Suspense>
        <PostProcessing />
        <FrameloopManager />
        <ContextLossGuard onLost={onLost} onRestored={onRestored} />
      </Canvas>
      {contextLost && (
        <SceneFallback
          message="The graphics context was lost. Reload to continue."
          onReload={() => window.location.reload()}
        />
      )}
    </>
  );
}
