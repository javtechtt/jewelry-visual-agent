"use client";

// Aurelis — the AI concierge presence. A luminous, pearlescent orb (NOT a dark
// sci-fi orb). It breathes when idle, brightens + quickens when listening, and
// pulses while speaking. Its position/scale lerp between scene targets so it
// grows and centers as you enter the Luminous Atelier.
//
// "Magic" is built from layered, reactive light, all in the ivory/champagne
// palette: a Fresnel aura shell (glowing rim), two crossed orbiting rings, a
// soft breathing outer aura, drifting sparkle motes, a spherical energy pulse
// that ripples out when Aurelis speaks, and a point light that spills the orb's
// glow onto the surrounding boutique.
//
// It also REACTS to the cursor: a screen-space proximity "flare" (computed by
// projecting the orb to NDC and measuring distance to the pointer) makes the
// whole presence bloom, quicken and swell as you move toward it.

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { AGENT } from "@/config/agent";
import { getSceneOrb } from "@/config/scenes";

// Fresnel rim glow — bright at the silhouette edge, transparent through the
// centre, so the orb reads as a luminous, volumetric presence rather than a
// solid ball. Additive so it stacks into the bloom.
const AURA_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const AURA_FRAGMENT = /* glsl */ `
  uniform vec3 uColorInner;
  uniform vec3 uColorOuter;
  uniform float uIntensity;
  uniform float uPower;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), uPower);
    vec3 col = mix(uColorInner, uColorOuter, fres) * uIntensity;
    gl_FragColor = vec4(col, fres);
  }
`;

// Hermite smoothstep — returns 1 near edge0, 0 near edge1 (edges may descend).
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

const RING1_OPACITY = 0.66;
const RING2_OPACITY = 0.5;

export default function AgentOrb() {
  const groupRef = useRef<THREE.Group>(null);
  // drei's MeshDistortMaterial instance (DistortMaterialImpl). Typed loosely:
  // we only touch standard-material fields plus the `distort`/`speed` uniforms.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matRef = useRef<any>(null);
  const flareGroupRef = useRef<THREE.Group>(null);
  const haloInnerRef = useRef<THREE.Mesh>(null);
  const haloOuterRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const rippleRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const scene = useExperienceStore((s) => s.scene);
  const view = useExperienceStore((s) => s.view);
  const agentState = useExperienceStore((s) => s.agentState);

  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const colorTarget = useMemo(() => new THREE.Color(), []);
  const orbNdc = useMemo(() => new THREE.Vector3(), []);
  // Smoothed 0..1 cursor-proximity flare.
  const flareRef = useRef(0);

  // Custom Fresnel aura material (animated via its uniforms in the frame loop).
  const auraMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColorInner: { value: new THREE.Color(AGENT.visual.glowColor) },
          uColorOuter: { value: new THREE.Color(AGENT.visual.coreColor) },
          uIntensity: { value: 2.4 },
          uPower: { value: 2.6 },
        },
        vertexShader: AURA_VERTEX,
        fragmentShader: AURA_FRAGMENT,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.FrontSide,
        toneMapped: false,
      }),
    [],
  );
  useEffect(() => () => auraMaterial.dispose(), [auraMaterial]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const def = getSceneOrb(scene, view);
    const k = 1 - Math.pow(0.001, delta);

    // Smoothly settle into the scene's orb position + scale.
    if (groupRef.current) {
      targetPos.set(def.position[0], def.position[1], def.position[2]);
      groupRef.current.position.lerp(targetPos, k);
      const nextScale = THREE.MathUtils.lerp(groupRef.current.scale.x, def.scale, k);
      groupRef.current.scale.setScalar(nextScale);
    }

    // ---- Cursor-proximity flare -----------------------------------------
    // Project the orb to normalized device coords and measure (aspect-aware)
    // screen distance to the pointer. Close cursor → flare toward 1.
    let flareTarget = 0;
    if (groupRef.current) {
      groupRef.current.getWorldPosition(orbNdc);
      orbNdc.project(state.camera);
      const aspect = state.size.width / Math.max(1, state.size.height);
      const dx = (state.pointer.x - orbNdc.x) * aspect;
      const dy = state.pointer.y - orbNdc.y;
      flareTarget = smoothstep(0.62, 0.1, Math.hypot(dx, dy));
    }
    flareRef.current = THREE.MathUtils.lerp(flareRef.current, flareTarget, k * 0.5);
    const flare = flareRef.current;

    const speed =
      (agentState === "speaking"
        ? 3.4
        : agentState === "listening"
          ? 2.4
          : agentState === "thinking"
            ? 1.8
            : 0.9) +
      flare * 1.4;
    const baseEmissive = agentState === "idle" ? 1.9 : 2.9;
    const pulse =
      baseEmissive +
      Math.sin(t * speed) * (agentState === "speaking" ? 1.1 : 0.5) +
      flare * 1.1;

    const stateColor =
      agentState === "listening"
        ? AGENT.visual.listeningColor
        : agentState === "speaking"
          ? AGENT.visual.speakingColor
          : AGENT.visual.coreColor;

    if (matRef.current) {
      matRef.current.emissiveIntensity = pulse;
      matRef.current.distort =
        (agentState === "thinking" ? 0.42 : 0.22 + Math.sin(t * 1.3) * 0.05) + flare * 0.08;
      matRef.current.speed = speed;
      colorTarget.set(stateColor);
      matRef.current.color.lerp(colorTarget, k);
    }

    // Fresnel aura: brightens + breathes with state, flares with proximity, and
    // tints its outer edge toward the active state colour for a living rim.
    const auraBase =
      agentState === "speaking" ? 4.2 : agentState === "listening" ? 3.3 : 2.6;
    auraMaterial.uniforms.uIntensity.value =
      auraBase + Math.sin(t * speed) * (agentState === "idle" ? 0.2 : 0.45) + flare * 2.0;
    // Lower power = wider, softer glow as the cursor approaches.
    auraMaterial.uniforms.uPower.value = 2.6 - flare * 0.8;
    colorTarget.set(stateColor);
    auraMaterial.uniforms.uColorOuter.value.lerp(colorTarget, k * 0.6);

    // Two soft halos breathing slightly out of phase = a deeper, living aura.
    if (haloInnerRef.current) {
      const s = 1 + Math.sin(t * speed) * 0.045 + flare * 0.05;
      haloInnerRef.current.scale.setScalar(s);
      const m = haloInnerRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.18 + Math.abs(Math.sin(t * speed)) * 0.1 + flare * 0.12;
    }
    if (haloOuterRef.current) {
      const s = 1 + Math.sin(t * speed * 0.6 + 1.2) * 0.06 + flare * 0.08;
      haloOuterRef.current.scale.setScalar(s);
      const m = haloOuterRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.08 + Math.abs(Math.sin(t * speed * 0.6 + 1.2)) * 0.06 + flare * 0.08;
    }

    // Crossed orbiting rings — a gyroscopic halo that quickens + brightens with
    // both state and cursor proximity.
    const ringSpin = (speed / 0.9) * (1 + flare * 0.8);
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.35 * ringSpin;
      ring1Ref.current.rotation.y += delta * 0.12;
      (ring1Ref.current.material as THREE.MeshBasicMaterial).opacity =
        RING1_OPACITY + flare * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 0.28 * ringSpin;
      ring2Ref.current.rotation.x += delta * 0.1;
      (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity =
        RING2_OPACITY + flare * 0.3;
    }

    // Spherical energy pulse — emanates while Aurelis is active OR while the
    // cursor is hovering close; invisible at rest.
    if (rippleRef.current) {
      const active = agentState === "speaking" || agentState === "listening";
      const m = rippleRef.current.material as THREE.MeshBasicMaterial;
      if (active || flare > 0.04) {
        const rate = agentState === "speaking" ? 0.7 : 0.45 + flare * 0.3;
        const phase = (t * rate) % 1;
        rippleRef.current.scale.setScalar(1 + phase * 1.7);
        m.opacity = (1 - phase) * (0.35 * (active ? 1 : 0) + flare * 0.4);
      } else {
        m.opacity = THREE.MathUtils.lerp(m.opacity, 0, k);
      }
    }

    // Point light spills the orb's glow onto nearby glass + products.
    if (lightRef.current) {
      lightRef.current.intensity =
        (agentState === "idle" ? 1.0 : 1.5) + Math.sin(t * speed) * 0.3 + flare * 1.1;
      lightRef.current.color.lerp(colorTarget, k * 0.5);
    }

    // The whole presence swells subtly toward the cursor.
    if (flareGroupRef.current) {
      flareGroupRef.current.scale.setScalar(1 + flare * 0.07);
    }
  });

  const initialOrb = getSceneOrb(scene, view);
  return (
    <group ref={groupRef} position={initialOrb.position} scale={initialOrb.scale}>
      <Float speed={1.4} rotationIntensity={0.32} floatIntensity={0.6}>
        <group ref={flareGroupRef}>
          {/* Pearlescent core. */}
          <mesh castShadow>
            <icosahedronGeometry args={[0.6, 10]} />
            <MeshDistortMaterial
              ref={matRef}
              color={AGENT.visual.coreColor}
              emissive={AGENT.visual.glowColor}
              emissiveIntensity={1.9}
              roughness={0.14}
              metalness={0.12}
              transparent
              opacity={0.96}
              distort={0.24}
              speed={1.4}
            />
          </mesh>

          {/* Fresnel aura shell — glowing silhouette edge. */}
          <mesh scale={1.16} material={auraMaterial}>
            <sphereGeometry args={[0.6, 64, 64]} />
          </mesh>

          {/* Inner + outer additive halos. */}
          <mesh ref={haloInnerRef} scale={1.45}>
            <sphereGeometry args={[0.6, 48, 48]} />
            <meshBasicMaterial
              color={AGENT.visual.glowColor}
              transparent
              opacity={0.18}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh ref={haloOuterRef} scale={2.0}>
            <sphereGeometry args={[0.6, 32, 32]} />
            <meshBasicMaterial
              color={AGENT.visual.coreColor}
              transparent
              opacity={0.08}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Spherical energy pulse (active / hover only). */}
          <mesh ref={rippleRef}>
            <sphereGeometry args={[0.62, 48, 48]} />
            <meshBasicMaterial
              color={AGENT.visual.glowColor}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.BackSide}
            />
          </mesh>

          {/* Crossed orbiting luminous rings. */}
          <mesh ref={ring1Ref} rotation={[1.15, 0, 0]}>
            <torusGeometry args={[0.98, 0.014, 16, 120]} />
            <meshBasicMaterial
              color={AGENT.visual.glowColor}
              transparent
              opacity={RING1_OPACITY}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh ref={ring2Ref} rotation={[-1.0, 0.6, 0]}>
            <torusGeometry args={[1.08, 0.01, 16, 120]} />
            <meshBasicMaterial
              color={AGENT.visual.listeningColor}
              transparent
              opacity={RING2_OPACITY}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* Drifting motes — a tight inner cloud + a wide ambient veil. */}
          <Sparkles count={26} scale={1.3} size={1.8} speed={0.5} color={AGENT.visual.coreColor} opacity={0.85} />
          <Sparkles count={46} scale={2.9} size={3.1} speed={0.32} color={AGENT.visual.glowColor} opacity={0.6} />

          {/* The orb as an actual light source in the scene. */}
          <pointLight ref={lightRef} color={AGENT.visual.glowColor} intensity={1.0} distance={8} decay={2} />
        </group>
      </Float>
    </group>
  );
}
