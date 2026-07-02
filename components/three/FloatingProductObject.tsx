"use client";

// A single floating piece in the boutique showcase: the product object (GLB or
// placeholder) and a minimal label. Hover blooms the piece; clicking (or saying
// its name) focuses/selects it so Aurelis — or the guest — can add it to the bag
// and head to checkout.

import { useState } from "react";
import { Float, Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import type { Product } from "@/types/product";
import type { Vec3 } from "@/types/experience";
import ProductObject from "./ProductObject";

interface FloatingProductObjectProps {
  product: Product;
  position: Vec3;
  rotationY?: number;
  /** Visual product scale — defaults to the desktop value (1). */
  objectScale?: number;
  /** Hit-target scale — defaults to the desktop value (1). */
  hitScale?: number;
  /** Label vertical offset — defaults to the desktop value. */
  labelY?: number;
  /** Html distanceFactor for the label — smaller = smaller on-screen text. */
  labelDistance?: number;
}

export default function FloatingProductObject({
  product,
  position,
  rotationY = 0,
  objectScale = 1,
  hitScale = 1,
  labelY = -0.95,
  labelDistance = 8,
}: FloatingProductObjectProps) {
  const [hovered, setHovered] = useState(false);
  const selectProduct = useExperienceStore((s) => s.selectProduct);
  const selectedId = useExperienceStore((s) => s.selectedProduct?.id);
  const selected = selectedId === product.id;

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    if (typeof document !== "undefined") document.body.style.cursor = "pointer";
  };
  const onOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    if (typeof document !== "undefined") document.body.style.cursor = "auto";
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectProduct({ id: product.id, name: product.name, priceLabel: product.priceLabel });
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Float speed={1.1} rotationIntensity={0.2} floatIntensity={0.5}>
        <group onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
          {/* Invisible hit target — keeps the whole piece area hoverable /
              clickable. Enlarged on touch (hitScale) for comfortable tapping. */}
          <mesh position={[0, 0.08, 0]}>
            <planeGeometry args={[1.1 * hitScale, 1.45 * hitScale]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <group position={[0, 0.08, 0.16]} scale={objectScale}>
            <ProductObject
              shape={product.shape}
              accent={product.accent}
              hovered={hovered}
              focused={selected}
              cutout={product.cutout}
              model={product.model}
            />
          </group>
          {/* Only the hovered / selected piece shows its name, so long product
              names on the arc can never overlap their neighbours at any viewport
              width. At rest the arc stays clean; the pieces are distinct enough
              to read on their own. */}
          {(hovered || selected) && (
            <Html
              center
              position={[0, labelY, 0.12]}
              distanceFactor={labelDistance}
              zIndexRange={[8, 0]}
              style={{ pointerEvents: "none" }}
            >
              <div className="scene-label">
                <span className="scene-label__name">{product.name}</span>
                <span className="scene-label__hint">
                  {selected ? product.priceLabel : product.tagline}
                </span>
              </div>
            </Html>
          )}
        </group>
      </Float>
    </group>
  );
}
