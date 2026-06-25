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
  /** When false, this object doesn't scale itself on hover (a parent does). */
  hoverScale?: boolean;
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

// The image fills a fixed rounded rectangle matching the glass case's portrait
// footprint, so there is never empty space; any aspect ratio is cover-cropped to
// that shape. Corner radius matches the glass case (0.12).
const CUTOUT_W = 0.92;
const CUTOUT_H = 1.21;
const CUTOUT_RADIUS = 0.12;
// The two image faces sit just inside the front + back of the glass slab.
const CUTOUT_FACE_OFFSET = 0.035;

/** A flat rounded-rectangle geometry with UVs remapped to 0..1 over its bounds. */
function roundedPlaneGeometry(width: number, height: number, radius: number) {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  const geometry = new THREE.ShapeGeometry(shape, 16);
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + w) / width, (pos.getY(i) + h) / height);
  }
  uv.needsUpdate = true;
  return geometry;
}

// One shared geometry — the cutout footprint is fixed, so it never varies.
const CUTOUT_GEOMETRY = roundedPlaneGeometry(CUTOUT_W, CUTOUT_H, CUTOUT_RADIUS);

/** Product image shown on BOTH faces of the glass, cover-cropped to fill it. */
function CutoutPlane({ src }: { src: string }) {
  const texture = useTexture(src);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    // Cover-crop the texture to the case footprint so it fills with no gaps.
    const image = texture.image as { width?: number; height?: number } | undefined;
    const imgAspect =
      image?.width && image?.height ? image.width / image.height : CUTOUT_W / CUTOUT_H;
    const planeAspect = CUTOUT_W / CUTOUT_H;
    if (imgAspect > planeAspect) {
      const rep = planeAspect / imgAspect;
      texture.repeat.set(rep, 1);
      texture.offset.set((1 - rep) / 2, 0);
    } else {
      const rep = imgAspect / planeAspect;
      texture.repeat.set(1, rep);
      texture.offset.set(0, (1 - rep) / 2);
    }
    texture.needsUpdate = true;
  }, [texture]);

  // Two single-sided faces (front + back of the case) so the image reads from
  // either side and never shows an opaque back. dispose={null} keeps the shared
  // geometry alive across mount/unmount.
  return (
    <group>
      <mesh geometry={CUTOUT_GEOMETRY} position={[0, 0, CUTOUT_FACE_OFFSET]} dispose={null}>
        <meshBasicMaterial map={texture} transparent toneMapped={false} side={THREE.FrontSide} />
      </mesh>
      <mesh geometry={CUTOUT_GEOMETRY} position={[0, 0, -CUTOUT_FACE_OFFSET]} dispose={null}>
        <meshBasicMaterial map={texture} transparent toneMapped={false} side={THREE.BackSide} />
      </mesh>
    </group>
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
    // Center the model on the group origin so it spins cleanly about its own
    // center (rather than swinging around an off-center pivot).
    root.position.set(-center.x * s, -center.y * s, -center.z * s);
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
  hoverScale = true,
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
      if (hoverScale) {
        const targetScale = active ? HOVER.scale : 1;
        const next = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, k);
        groupRef.current.scale.setScalar(next);
      }
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
