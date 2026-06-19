"use client";

// Renders a product as a premium placeholder mesh chosen by `shape`. Hover/focus
// drives a subtle scale + emissive bloom (see config/motion.ts). When a real
// asset is supplied (`cutout` image or `model` GLB) it renders that instead —
// so dropping files into /public swaps the visual with no scene changes.
//
// See docs/ASSET_PIPELINE.md.

import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
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
      return { color: accent.base, metalness: 0.25, roughness: 0.32 };
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

// Real GLB/GLTF models are normalized to this uniform size (largest dimension,
// world units) so arbitrary exports sit correctly on the panel.
const MODEL_FIT_SIZE = 1.05;

/** Real GLB/GLTF model — cloned, auto-centered and scaled to fit. */
function ModelObject({ src }: { src: string }) {
  const { scene } = useGLTF(src);
  const fitted = useMemo(() => {
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = MODEL_FIT_SIZE / maxDim;
    root.scale.setScalar(s);
    // Center x/y on the panel, but anchor the model's BACK (min z) to the group
    // origin so the whole model sits in FRONT of the frosted glass panel rather
    // than embedded in it — otherwise the translucent glass tints its rear half.
    root.position.set(-center.x * s, -center.y * s, -box.min.z * s);
    return root;
  }, [scene]);
  return <primitive object={fitted} />;
}

/** If a model fails to load (e.g. network/decoder), show the image/placeholder. */
class ModelErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
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

  const placeholder = <ShapeMesh shape={shape} material={material} />;
  const imageOrShape = cutout ? (
    <Suspense fallback={placeholder}>
      <CutoutPlane src={cutout} />
    </Suspense>
  ) : (
    placeholder
  );

  let content: ReactNode;
  if (model) {
    // Prefer the GLB; fall back to the showcase image (then placeholder).
    content = (
      <ModelErrorBoundary fallback={imageOrShape}>
        <Suspense fallback={placeholder}>
          <ModelObject src={model} />
        </Suspense>
      </ModelErrorBoundary>
    );
  } else {
    content = imageOrShape;
  }

  return <group ref={groupRef}>{content}</group>;
}
