"use client";

// A 2.5D frosted-glass display panel — the "boutique window" surface behind a
// product object. Uses a translucent physical material (cheap, no transmission
// render pass) plus an additive glow rim that brightens on hover/focus.

import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { CategoryAccent } from "@/types/category";

interface ProductDisplayPanelProps {
  accent: CategoryAccent;
  width?: number;
  height?: number;
  active?: boolean;
}

export default function ProductDisplayPanel({
  accent,
  width = 1.15,
  height = 1.55,
  active = false,
}: ProductDisplayPanelProps) {
  return (
    <group>
      {/* Glow rim sits just behind the glass. */}
      <RoundedBox
        args={[width + 0.06, height + 0.06, 0.02]}
        radius={0.12}
        smoothness={4}
        position={[0, 0, -0.06]}
      >
        <meshBasicMaterial
          color={accent.glow}
          transparent
          opacity={active ? 0.55 : 0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </RoundedBox>

      {/* Frosted glass slab. */}
      <RoundedBox args={[width, height, 0.08]} radius={0.12} smoothness={6} castShadow>
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={active ? 0.28 : 0.17}
          roughness={0.1}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.18}
          ior={1.3}
          reflectivity={0.4}
        />
      </RoundedBox>
    </group>
  );
}
