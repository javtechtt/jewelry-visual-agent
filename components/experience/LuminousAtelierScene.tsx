"use client";

// Screen 2 — the Luminous Atelier. The orb is large and central; the selected
// category's product options orbit slowly around it on glass plinths. Hovering
// blooms a piece; clicking selects it (ready for demo checkout/booking).

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { getCategoryOptions } from "@/config/category-options";
import { CATEGORY_MAP } from "@/config/categories";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { ATELIER_LAYOUT } from "@/config/scenes";
import { HOVER } from "@/config/motion";
import type { CategoryOption } from "@/types/category";
import type { Vec3 } from "@/types/experience";
import AgentOrb from "@/components/three/AgentOrb";
import ProductDisplayPanel from "@/components/three/ProductDisplayPanel";
import ProductObject from "@/components/three/ProductObject";

function AtelierOption({
  option,
  position,
  scale,
  focused,
  onSelect,
}: {
  option: CategoryOption;
  position: Vec3;
  scale: number;
  focused: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);

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
    onSelect();
  };

  const active = hovered || focused;

  const spinRef = useRef<THREE.Group>(null);
  const rootRef = useRef<THREE.Group>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const worldPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    // Spin the case + product as one unit; grow the whole unit on hover.
    if (spinRef.current) {
      const k = 1 - Math.pow(0.0015, delta);
      const target = active ? HOVER.scale : 1;
      spinRef.current.scale.setScalar(THREE.MathUtils.lerp(spinRef.current.scale.x, target, k));
      spinRef.current.rotation.y += delta * (active ? 0.5 : 0.18);
    }
    // Show the title only on the FRONT half of the orbit (nearer the camera).
    // Smoothstep over the orbit depth fades it as the case crosses the sides;
    // the band is centred on the ring's -0.3 z offset, so front = full, back =
    // hidden, sides ≈ 50% — across every responsive ring radius.
    if (rootRef.current && labelRef.current) {
      rootRef.current.getWorldPosition(worldPos);
      labelRef.current.style.opacity = String(THREE.MathUtils.smoothstep(worldPos.z, -1.2, 0.6));
    }
  });

  return (
    <group ref={rootRef} position={position} scale={scale}>
      <Float speed={1.3} rotationIntensity={0.25} floatIntensity={0.7}>
        <group onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
          {/* Case + product rotate together (option #2) so they stay in sync. */}
          <group ref={spinRef}>
            <ProductDisplayPanel accent={option.accent} active={active} width={0.95} height={1.25} />
            {/* Centered on the glass + spin axis; CutoutPlane renders the image
                on both faces. spin/hoverScale are handled by the parent group. */}
            <group position={[0, 0.05, 0]}>
              <ProductObject
                shape={option.shape}
                accent={option.accent}
                hovered={hovered}
                focused={focused}
                spin={false}
                hoverScale={false}
                cutout={option.cutout}
                model={option.model}
              />
            </group>
          </group>
          <Html
            center
            position={[0, -0.82, 0.12]}
            distanceFactor={7}
            zIndexRange={[8, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div ref={labelRef} className={`scene-label${active ? " scene-label--active" : ""}`}>
              <span className="scene-label__name">{option.name}</span>
              <span className="scene-label__hint">{option.priceLabel}</span>
            </div>
          </Html>
        </group>
      </Float>
    </group>
  );
}

export default function LuminousAtelierScene() {
  const ringRef = useRef<THREE.Group>(null);
  const activeCategory = useExperienceStore((s) => s.activeCategory);
  const selectedProduct = useExperienceStore((s) => s.selectedProduct);
  const selectProduct = useExperienceStore((s) => s.selectProduct);
  const view = useExperienceStore((s) => s.view);
  const layout = ATELIER_LAYOUT[view];

  const options = useMemo(
    () => (activeCategory ? getCategoryOptions(activeCategory) : []),
    [activeCategory],
  );
  const categoryLabel = activeCategory ? CATEGORY_MAP[activeCategory].label : "";

  // Index of the focused option (selected by click or the agent), if any.
  const focusedIndex = useMemo(
    () => (selectedProduct ? options.findIndex((o) => o.id === selectedProduct.id) : -1),
    [selectedProduct, options],
  );

  useFrame((_, delta) => {
    if (!ringRef.current) return;
    if (focusedIndex >= 0 && options.length > 0) {
      // Quickly rotate the focused option to the front of the orbit, then hold
      // there (shortest angular path). Option i fronts at ring.y = i/n * 2π.
      const target = (focusedIndex / options.length) * Math.PI * 2;
      const cur = ringRef.current.rotation.y;
      const diff = Math.atan2(Math.sin(target - cur), Math.cos(target - cur));
      ringRef.current.rotation.y = cur + diff * (1 - Math.pow(0.0009, delta));
    } else {
      ringRef.current.rotation.y += delta * 0.06;
    }
  });

  return (
    <group>
      <AgentOrb />

      <group ref={ringRef}>
        {options.map((option, index) => {
          const angle = (index / options.length) * Math.PI * 2 + Math.PI / 2;
          const x = Math.cos(angle) * layout.ringRadius;
          const z = Math.sin(angle) * layout.ringRadius - 0.3;
          const y = 0.45 + Math.sin(angle * 2) * 0.18;
          return (
            <AtelierOption
              key={option.id}
              option={option}
              position={[x, y, z]}
              scale={layout.optionScale}
              focused={selectedProduct?.id === option.id}
              onSelect={() =>
                selectProduct({
                  id: option.id,
                  categoryId: option.categoryId,
                  name: option.name,
                  priceLabel: option.priceLabel,
                })
              }
            />
          );
        })}
      </group>

      <Html
        center
        position={[0, layout.titleY, 0]}
        distanceFactor={layout.titleDistance}
        zIndexRange={[8, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div className="atelier-title">{categoryLabel}</div>
      </Html>
    </group>
  );
}
