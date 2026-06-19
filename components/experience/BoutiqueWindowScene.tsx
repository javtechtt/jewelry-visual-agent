"use client";

// Screen 1 — the Boutique Window. The seven categories float in a gentle arc as
// glass-panelled product displays, with Aurelis present behind them. Layout is
// fully derived from config/categories.ts.

import { CATEGORIES } from "@/config/categories";
import type { Vec3 } from "@/types/experience";
import AgentOrb from "@/components/three/AgentOrb";
import FloatingCategoryObject from "@/components/three/FloatingCategoryObject";

const SPREAD = 9.6; // total horizontal width of the arc

export default function BoutiqueWindowScene() {
  const count = CATEGORIES.length;

  return (
    <group>
      <AgentOrb />
      {CATEGORIES.map((category, index) => {
        const t = count > 1 ? index / (count - 1) : 0.5;
        const x = (t - 0.5) * SPREAD;
        const z = -Math.abs(x) * 0.18; // curve the ends gently away
        const position: Vec3 = [x, 0.3, z];
        const rotationY = -x * 0.05; // turn panels toward the camera
        return (
          <FloatingCategoryObject
            key={category.id}
            category={category}
            position={position}
            rotationY={rotationY}
          />
        );
      })}
    </group>
  );
}
