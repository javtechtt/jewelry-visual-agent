"use client";

// A single floating category in the Boutique Window: a frosted glass panel, a
// placeholder product object, and a minimal label. Hover blooms the panel +
// product; clicking (or saying the category) transitions into the Atelier.

import { useState } from "react";
import { Float, Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import type { Category } from "@/types/category";
import type { Vec3 } from "@/types/experience";
import ProductDisplayPanel from "./ProductDisplayPanel";
import ProductObject from "./ProductObject";

interface FloatingCategoryObjectProps {
  category: Category;
  position: Vec3;
  rotationY?: number;
}

export default function FloatingCategoryObject({
  category,
  position,
  rotationY = 0,
}: FloatingCategoryObjectProps) {
  const [hovered, setHovered] = useState(false);
  const enterCategory = useExperienceStore((s) => s.enterCategory);
  const setHoveredCategory = useExperienceStore((s) => s.setHoveredCategory);

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    setHoveredCategory(category.id);
    if (typeof document !== "undefined") document.body.style.cursor = "pointer";
  };
  const onOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    setHoveredCategory(null);
    if (typeof document !== "undefined") document.body.style.cursor = "auto";
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    enterCategory(category.id);
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Float speed={1.1} rotationIntensity={0.2} floatIntensity={0.5}>
        <group onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
          <ProductDisplayPanel accent={category.accent} active={hovered} />
          <group position={[0, 0.08, 0.16]}>
            <ProductObject
              shape={category.shape}
              accent={category.accent}
              hovered={hovered}
              cutout={category.cutout}
              model={category.model}
            />
          </group>
          <Html
            center
            position={[0, -0.95, 0.12]}
            distanceFactor={8}
            zIndexRange={[8, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div className="scene-label">
              <span className="scene-label__name">{category.label}</span>
              <span className="scene-label__hint">{hovered ? category.tagline : ""}</span>
            </div>
          </Html>
        </group>
      </Float>
    </group>
  );
}
