"use client";

// An "underground" cursor hover: a soft pool of light that lives ON the boutique
// floor and tracks the pointer. The floating products + orb hover above it and
// the reflective floor mirrors it, so the glow reads as if it's beneath the
// items rather than a film on top of the page.
//
// The 2D cursor is raycast onto the floor plane each frame to get a world
// position; the pool (an additive radial disc) and a faint up-light lerp toward
// it, grazing the undersides of nearby items as you move. Colour follows
// Aurelis's mood.

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";

// Sits just above the reflective floor (which is at y = -0.9) to avoid z-fight.
const FLOOR_Y = -0.88;

// Dedicated, saturated glow tones (NOT the near-white orb colours) so the pool
// reads as a soft tinted champagne wash on the floor instead of a white blowout.
const GLOW_IDLE = "#c79a52"; // warm champagne gold
const GLOW_LISTENING = "#8fb3cf"; // soft dusty blue
const GLOW_SPEAKING = "#d2a35d"; // warm amber

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float d = distance(vUv, vec2(0.5)) * 2.0; // 0 at centre, 1 at disc edge
    // Higher exponent = a more feathered, gentle pool with no hot core.
    float a = pow(smoothstep(1.0, 0.0, d), 2.6);
    gl_FragColor = vec4(uColor * uIntensity, a);
  }
`;

export default function CursorFloorGlow() {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const agentState = useExperienceStore((s) => s.agentState);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(GLOW_IDLE) },
          uIntensity: { value: 0.5 },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  // Reusable math objects (allocate once).
  const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR_Y), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(0, FLOOR_Y, 0), []);
  const colorTarget = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    // Slower trail than before → the pool drifts after the cursor, softer feel.
    const k = 1 - Math.pow(0.05, delta);

    // Project the cursor onto the floor plane → world position to follow.
    state.raycaster.setFromCamera(state.pointer, state.camera);
    if (state.raycaster.ray.intersectPlane(floorPlane, hit)) {
      target.set(hit.x, FLOOR_Y, hit.z);
    }

    if (meshRef.current) {
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, target.x, k);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, target.z, k);
    }

    const stateColor =
      agentState === "listening"
        ? GLOW_LISTENING
        : agentState === "speaking"
          ? GLOW_SPEAKING
          : GLOW_IDLE;
    colorTarget.set(stateColor);
    material.uniforms.uColor.value.lerp(colorTarget, k * 0.4);

    // Very gentle breath at low intensity so it never reads as a white hotspot.
    const t = state.clock.elapsedTime;
    const base = agentState === "idle" ? 0.42 : 0.55;
    material.uniforms.uIntensity.value = base + Math.sin(t * 1.1) * 0.05;

    if (lightRef.current) {
      lightRef.current.position.set(target.x, FLOOR_Y + 0.6, target.z);
      lightRef.current.color.lerp(colorTarget, k * 0.4);
    }
  });

  return (
    <group>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 0]} material={material}>
        <planeGeometry args={[5.5, 5.5]} />
      </mesh>
      {/* Faint up-light so items catch the glow from beneath as it passes. */}
      <pointLight
        ref={lightRef}
        color={GLOW_IDLE}
        intensity={0.3}
        distance={4.5}
        decay={2}
        position={[0, FLOOR_Y + 0.6, 0]}
      />
    </group>
  );
}
