"use client";

// Screen 1 — the Boutique Window.
// - Desktop / landscape: the categories float in a gentle horizontal arc.
// - Portrait (phones): a single large category hero, centred, that the guest
//   swipes through one at a time (tap to enter), with a dot indicator. A
//   vertical column never fit five 3D pieces on a narrow screen, so portrait
//   shows one at a time instead.

import { useEffect, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Float, Html } from "@react-three/drei";
import * as THREE from "three";
import { CATEGORIES } from "@/config/categories";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { BOUTIQUE_LAYOUT } from "@/config/scenes";
import type { Category } from "@/types/category";
import type { Vec3 } from "@/types/experience";
import AgentOrb from "@/components/three/AgentOrb";
import FloatingCategoryObject from "@/components/three/FloatingCategoryObject";
import ProductObject from "@/components/three/ProductObject";

export default function BoutiqueWindowScene() {
  const view = useExperienceStore((s) => s.view);
  return view === "portrait" ? <BoutiqueCarousel /> : <BoutiqueArc />;
}

// --- Desktop / landscape: the original horizontal arc (unchanged) -----------
function BoutiqueArc() {
  const count = CATEGORIES.length;
  const view = useExperienceStore((s) => s.view);
  const layout = BOUTIQUE_LAYOUT[view];

  return (
    <group>
      <AgentOrb />
      {CATEGORIES.map((category, index) => {
        const t = count > 1 ? index / (count - 1) : 0.5;
        const x = (t - 0.5) * layout.spread;
        const z = -Math.abs(x) * 0.18; // curve the ends gently away
        const position: Vec3 = [x, 0.3, z];
        const rotationY = -x * 0.05; // turn panels toward the camera
        return (
          <FloatingCategoryObject
            key={category.id}
            category={category}
            position={position}
            rotationY={rotationY}
            objectScale={layout.objectScale}
            hitScale={layout.hitScale}
            labelY={layout.labelY}
            labelDistance={layout.labelDistance}
          />
        );
      })}
    </group>
  );
}

// --- Portrait: one large hero, swipe to browse ------------------------------
const GAP = 3.2; // world-space spacing between cards (neighbours sit off-screen)
const CARD_SCALE = 1.55;
const AUTO_INTERVAL = 3.5; // seconds between automatic advances

function BoutiqueCarousel() {
  const count = CATEGORIES.length;
  const enterCategory = useExperienceStore((s) => s.enterCategory);
  const groupRef = useRef<THREE.Group>(null);
  const posRef = useRef(0); // continuous carousel position (in card units)
  const targetRef = useRef(0); // snapped target index
  const drag = useRef({ startX: 0, base: 0, active: false, moved: 0 });
  const autoRef = useRef(0); // seconds since the last automatic advance
  const dirRef = useRef(1); // ping-pong direction for the auto-advance
  const [focus, setFocus] = useState(0);

  const release = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (drag.current.moved < 0.4) {
      // A tap (not a swipe) → enter the centred category.
      const i = THREE.MathUtils.clamp(Math.round(posRef.current), 0, count - 1);
      enterCategory(CATEGORIES[i].id);
      return;
    }
    // A moderate flick advances one card in the drag direction; otherwise snap
    // back to the nearest.
    const delta = posRef.current - drag.current.base;
    const step = Math.abs(delta) > 0.18 ? Math.sign(delta) : 0;
    const snapped = THREE.MathUtils.clamp(Math.round(drag.current.base) + step, 0, count - 1);
    targetRef.current = snapped;
    setFocus(snapped);
  };

  // End/settle the gesture even if the pointer is released off the canvas.
  useEffect(() => {
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    if (drag.current.active) {
      autoRef.current = 0; // never auto-advance while the guest is dragging
    } else {
      // Auto-advance through the categories, bouncing back at the ends.
      autoRef.current += delta;
      if (count > 1 && autoRef.current >= AUTO_INTERVAL) {
        autoRef.current = 0;
        let next = Math.round(targetRef.current) + dirRef.current;
        if (next > count - 1) {
          next = count - 2;
          dirRef.current = -1;
        } else if (next < 0) {
          next = 1;
          dirRef.current = 1;
        }
        targetRef.current = next;
        setFocus(next);
      }
      posRef.current = THREE.MathUtils.lerp(posRef.current, targetRef.current, 1 - Math.pow(0.0015, delta));
    }
    if (groupRef.current) groupRef.current.position.x = -posRef.current * GAP;
  });

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    autoRef.current = 0; // reset the auto-advance clock on any touch
    drag.current = { startX: e.point.x, base: posRef.current, active: true, moved: 0 };
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!drag.current.active) return;
    const dx = e.point.x - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    posRef.current = drag.current.base - dx / GAP;
  };

  return (
    <group>
      <AgentOrb />

      {/* Full-view invisible surface that captures swipe + tap. */}
      <mesh position={[0, 0.4, 2]} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={release}>
        <planeGeometry args={[24, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={groupRef}>
        {CATEGORIES.map((category, index) => (
          <CarouselCard key={category.id} category={category} x={index * GAP} />
        ))}
      </group>

      {/* Dot indicator — also tappable to jump to a category. */}
      <Html center position={[0, -1.55, 0]} distanceFactor={6} zIndexRange={[30, 0]}>
        <div className="boutique-dots">
          {CATEGORIES.map((c, i) => (
            <button
              key={c.id}
              type="button"
              aria-label={c.label}
              className={`boutique-dot${i === focus ? " boutique-dot--on" : ""}`}
              onClick={() => {
                autoRef.current = 0;
                dirRef.current = i >= focus ? 1 : -1;
                targetRef.current = i;
                setFocus(i);
              }}
            />
          ))}
        </div>
      </Html>
    </group>
  );
}

function CarouselCard({ category, x }: { category: Category; x: number }) {
  return (
    <group position={[x, 0.55, 0]}>
      <Float speed={1.1} rotationIntensity={0.18} floatIntensity={0.5}>
        <group scale={CARD_SCALE}>
          <ProductObject
            shape={category.shape}
            accent={category.accent}
            cutout={category.cutout}
            model={category.model}
          />
        </group>
      </Float>
      <Html center position={[0, -1.35, 0]} distanceFactor={4.4} zIndexRange={[8, 0]} style={{ pointerEvents: "none" }}>
        <div className="scene-label">
          <span className="scene-label__name">{category.label}</span>
        </div>
      </Html>
    </group>
  );
}
