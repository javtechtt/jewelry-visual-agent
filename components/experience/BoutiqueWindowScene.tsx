"use client";

// Screen 1 — the Boutique Window. The seven categories float in a gentle arc as
// glass-panelled product displays, with Aurelis present behind them. Layout is
// fully derived from config/categories.ts.

import { CATEGORIES } from "@/config/categories";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { BOUTIQUE_LAYOUT } from "@/config/scenes";
import type { Vec3 } from "@/types/experience";
import AgentOrb from "@/components/three/AgentOrb";
import FloatingCategoryObject from "@/components/three/FloatingCategoryObject";

export default function BoutiqueWindowScene() {
  const count = CATEGORIES.length;
  const view = useExperienceStore((s) => s.view);
  const layout = BOUTIQUE_LAYOUT[view];

  return (
    <group>
      <AgentOrb />
      {CATEGORIES.map((category, index) => {
        const t = count > 1 ? index / (count - 1) : 0.5;

        let position: Vec3;
        let rotationY: number;
        if (layout.vertical) {
          // Portrait: a gentle vertical S-curve so all categories stay framed and
          // tappable on a narrow screen (a horizontal arc would clip or overlap).
          const x = Math.sin(t * Math.PI * 2) * layout.zig;
          const y = (0.5 - t) * layout.vSpread + 0.3;
          const z = -Math.abs(x) * 0.12;
          position = [x, y, z];
          rotationY = -x * 0.06;
        } else {
          // Desktop/landscape: the original horizontal arc (SPREAD per view).
          const x = (t - 0.5) * layout.spread;
          const z = -Math.abs(x) * 0.18; // curve the ends gently away
          position = [x, 0.3, z];
          rotationY = -x * 0.05; // turn panels toward the camera
        }

        return (
          <FloatingCategoryObject
            key={category.id}
            category={category}
            position={position}
            rotationY={rotationY}
            objectScale={layout.objectScale}
            hitScale={layout.hitScale}
            labelY={layout.labelY}
          />
        );
      })}
    </group>
  );
}
