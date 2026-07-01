"use client";

// The boutique "room": a reflective floor, a soft back wall, contact shadows,
// gentle fog for depth, and a procedural studio Environment built from
// Lightformers (no external HDRI — works fully offline). Tinted to the light
// premium (ivory / champagne) atmosphere of the boutique home page.

import {
  ContactShadows,
  Environment,
  Lightformer,
  MeshReflectorMaterial,
} from "@react-three/drei";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { SCENES } from "@/config/scenes";
import { QUALITY } from "@/config/responsive";

export default function EnvironmentStage() {
  const scene = useExperienceStore((s) => s.scene);
  const view = useExperienceStore((s) => s.view);
  const atmosphere = SCENES[scene].atmosphere;
  // Desktop keeps full-resolution render targets; handheld views trim only the
  // GPU-heavy reflection + contact-shadow buffers for a smoother framerate.
  const quality = QUALITY[view];

  return (
    <group>
      {/* Opaque light backdrop — gives the composer a clean, bright base
          (no transparency artifacts) for the seamless studio-cove look. */}
      <color attach="background" args={[atmosphere.top]} />
      {/* Depth haze tuned to the lower atmosphere tone. */}
      <fog attach="fog" args={[atmosphere.bottom, 11, 26]} />

      {/* Reflective marble-like floor. raycast disabled so it never occludes
          Html labels or intercepts pointer events. On the tightest (portrait)
          tier the per-frame planar reflection is dropped for a flat floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]} receiveShadow raycast={() => null}>
        <planeGeometry args={[70, 70]} />
        {quality.reflections ? (
          <MeshReflectorMaterial
            resolution={quality.reflectorResolution}
            mirror={0.42}
            mixBlur={8}
            mixStrength={1.1}
            blur={[420, 110]}
            roughness={0.8}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.25}
            color={atmosphere.bottom}
            metalness={0.18}
          />
        ) : (
          <meshStandardMaterial color={atmosphere.bottom} roughness={0.9} metalness={0.1} />
        )}
      </mesh>

      {/* Soft luminous back wall. raycast disabled (never an occluder). */}
      <mesh position={[0, 4.5, -9]} raycast={() => null}>
        <planeGeometry args={[70, 34]} />
        <meshStandardMaterial color={atmosphere.top} roughness={1} metalness={0} />
      </mesh>

      <ContactShadows
        position={[0, -0.89, 0]}
        opacity={0.34}
        scale={28}
        blur={2.8}
        far={6}
        resolution={quality.contactShadowResolution}
        color="#7c715c"
      />

      {/* Procedural studio reflections — soft champagne key + cool rim. */}
      <Environment resolution={256} frames={1}>
        <group>
          <Lightformer
            form="rect"
            intensity={2.4}
            color="#fff4e2"
            position={[0, 5, -3]}
            scale={[12, 7, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1.3}
            color="#ffffff"
            position={[-6, 2.5, 2]}
            rotation-y={Math.PI / 4}
            scale={[7, 7, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1.1}
            color="#e8f0ff"
            position={[6, 2.5, 2]}
            rotation-y={-Math.PI / 4}
            scale={[7, 7, 1]}
          />
          <Lightformer
            form="ring"
            intensity={1.5}
            color="#ffe7c2"
            position={[0, 3, 5]}
            scale={[3.4, 3.4, 1]}
          />
        </group>
      </Environment>
    </group>
  );
}
