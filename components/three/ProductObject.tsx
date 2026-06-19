"use client";

// Renders a product as a premium placeholder mesh chosen by `shape`. Hover/focus
// drives a subtle scale + emissive bloom (see config/motion.ts). When a real
// asset is supplied (`cutout` image or `model` GLB) it renders that instead —
// so dropping files into /public swaps the visual with no scene changes.
//
// See docs/ASSET_PIPELINE.md.

import { Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { CategoryAccent, ProductShape } from "@/types/category";
import { HOVER } from "@/config/motion";

interface ProductObjectProps {
  shape: ProductShape;
  accent: CategoryAccent;
  hovered?: boolean;
  focused?: boolean;
  spin?: boolean;
  cutout?: string;
  model?: string;
}

function materialParams(shape: ProductShape, accent: CategoryAccent) {
  switch (shape) {
    case "watch":
    case "ring":
    case "accessory":
      return { color: accent.base, metalness: 0.85, roughness: 0.16 };
    case "bottle":
      return { color: accent.base, metalness: 0.1, roughness: 0.06 };
    case "bag":
    case "giftbox":
      return { color: accent.base, metalness: 0.25, roughness: 0.32 };
    case "concierge":
    default:
      return { color: accent.base, metalness: 0.55, roughness: 0.12 };
  }
}

function ShapeMesh({ shape, material }: { shape: ProductShape; material: THREE.Material }) {
  switch (shape) {
    case "watch":
      return (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh material={material}>
            <torusGeometry args={[0.3, 0.06, 24, 48]} />
          </mesh>
          <mesh material={material} position={[0, 0, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.08, 48]} />
          </mesh>
          <mesh material={material} position={[0, 0.36, 0]}>
            <boxGeometry args={[0.1, 0.16, 0.08]} />
          </mesh>
          <mesh material={material} position={[0, -0.36, 0]}>
            <boxGeometry args={[0.1, 0.16, 0.08]} />
          </mesh>
        </group>
      );
    case "ring":
      return (
        <group rotation={[Math.PI / 2.4, 0, 0]}>
          <mesh material={material}>
            <torusGeometry args={[0.28, 0.075, 28, 64]} />
          </mesh>
          <mesh material={material} position={[0, 0.32, 0]}>
            <octahedronGeometry args={[0.12, 0]} />
          </mesh>
        </group>
      );
    case "bag":
      return (
        <group>
          <mesh material={material}>
            <boxGeometry args={[0.6, 0.46, 0.22]} />
          </mesh>
          <mesh material={material} position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.18, 0.03, 16, 40, Math.PI]} />
          </mesh>
        </group>
      );
    case "bottle":
      return (
        <group>
          <mesh material={material}>
            <cylinderGeometry args={[0.18, 0.2, 0.5, 40]} />
          </mesh>
          <mesh material={material} position={[0, 0.34, 0]}>
            <boxGeometry args={[0.12, 0.14, 0.12]} />
          </mesh>
        </group>
      );
    case "accessory":
      return (
        <mesh material={material}>
          <torusKnotGeometry args={[0.2, 0.06, 128, 24]} />
        </mesh>
      );
    case "giftbox":
      return (
        <group>
          <mesh material={material}>
            <boxGeometry args={[0.46, 0.46, 0.46]} />
          </mesh>
          <mesh material={material}>
            <boxGeometry args={[0.5, 0.1, 0.5]} />
          </mesh>
          <mesh material={material}>
            <boxGeometry args={[0.1, 0.5, 0.5]} />
          </mesh>
          <mesh material={material} position={[0, 0.3, 0]}>
            <octahedronGeometry args={[0.12, 0]} />
          </mesh>
        </group>
      );
    case "concierge":
    default:
      return (
        <mesh material={material}>
          <octahedronGeometry args={[0.42, 0]} />
        </mesh>
      );
  }
}

// Plane is sized to fit within this box while preserving the image's aspect
// ratio, so full-frame internet photos and transparent cutouts both render
// undistorted on the glass panel.
const CUTOUT_MAX_W = 0.98;
const CUTOUT_MAX_H = 1.22;

/** Real product image rendered as a 2.5D textured plane. */
function CutoutPlane({ src }: { src: string }) {
  const texture = useTexture(src);

  const size = useMemo<[number, number]>(() => {
    const image = texture.image as { width?: number; height?: number } | undefined;
    const aspect = image?.width && image?.height ? image.width / image.height : 0.82;
    let width = CUTOUT_MAX_W;
    let height = width / aspect;
    if (height > CUTOUT_MAX_H) {
      height = CUTOUT_MAX_H;
      width = height * aspect;
    }
    return [width, height];
  }, [texture]);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <mesh>
      <planeGeometry args={size} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  );
}

/** Real GLB/GLTF model. */
function ModelObject({ src }: { src: string }) {
  const { scene } = useGLTF(src);
  return <primitive object={scene} />;
}

export default function ProductObject({
  shape,
  accent,
  hovered = false,
  focused = false,
  spin = true,
  cutout,
  model,
}: ProductObjectProps) {
  const groupRef = useRef<THREE.Group>(null);

  const material = useMemo(() => {
    const params = materialParams(shape, accent);
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(params.color),
      metalness: params.metalness,
      roughness: params.roughness,
      clearcoat: 1,
      clearcoatRoughness: 0.2,
      emissive: new THREE.Color(accent.glow),
      emissiveIntensity: 0.12,
    });
  }, [shape, accent]);

  useEffect(() => () => material.dispose(), [material]);

  const active = hovered || focused;

  useFrame((_, delta) => {
    const k = 1 - Math.pow(0.0015, delta);
    if (groupRef.current) {
      const targetScale = active ? HOVER.scale : 1;
      const next = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, k);
      groupRef.current.scale.setScalar(next);
      if (spin) groupRef.current.rotation.y += delta * (active ? 0.5 : 0.18);
    }
    const targetEmissive = active ? 0.12 * HOVER.emissiveBoost : 0.12;
    material.emissiveIntensity = THREE.MathUtils.lerp(
      material.emissiveIntensity,
      targetEmissive,
      k,
    );
  });

  let content: ReactNode;
  if (model) {
    content = (
      <Suspense fallback={<ShapeMesh shape={shape} material={material} />}>
        <ModelObject src={model} />
      </Suspense>
    );
  } else if (cutout) {
    content = (
      <Suspense fallback={<ShapeMesh shape={shape} material={material} />}>
        <CutoutPlane src={cutout} />
      </Suspense>
    );
  } else {
    content = <ShapeMesh shape={shape} material={material} />;
  }

  return <group ref={groupRef}>{content}</group>;
}
