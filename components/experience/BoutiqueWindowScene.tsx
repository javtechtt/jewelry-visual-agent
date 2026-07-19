"use client";

// The boutique home page — the single showcase.
// - Desktop / landscape: a two-up product selector — exactly two pieces on
//   screen at a time (left + right slot), the guest pages through the pairs.
// - Portrait (phones): a single large hero the guest swipes through one at a
//   time (tap to focus), with a dot indicator. A vertical column never fit the
//   pieces on a narrow screen, so portrait shows one at a time instead.

import { useEffect, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { Float, Html } from "@react-three/drei";
import * as THREE from "three";
import { PRODUCTS } from "@/config/products";
import { DUO_PAGE_COUNT, useExperienceStore } from "@/lib/stores/useExperienceStore";
import { DUO_LAYOUT, getDuoSlot } from "@/config/scenes";
import type { Product } from "@/types/product";
import FloatingProductObject from "@/components/three/FloatingProductObject";
import ProductObject from "@/components/three/ProductObject";

export default function BoutiqueWindowScene() {
  const view = useExperienceStore((s) => s.view);
  return view === "portrait" ? <BoutiqueCarousel /> : <BoutiqueDuo />;
}

// Seconds each pair holds before the selector auto-advances to the next.
const DUO_AUTO_INTERVAL = 4.2;

// --- Desktop / landscape: the two-up paged selector --------------------------
// Only the current page's two pieces are ever mounted, so no more than two are
// on screen at once. Turning the page swaps the pair with a quick scale-out →
// swap → scale-in so the exchange reads as a deliberate "flip", never a pop.
// At rest it auto-scrolls through the pairs (ping-ponging at the ends); focusing
// a piece or a manual page turn pauses/resets the timer.
function BoutiqueDuo() {
  const view = useExperienceStore((s) => s.view);
  const layout = DUO_LAYOUT[view];
  const duoPage = useExperienceStore((s) => s.duoPage);
  const setDuoPage = useExperienceStore((s) => s.setDuoPage);
  const focused = useExperienceStore((s) => s.selectedProduct !== null);
  const clearSelectedProduct = useExperienceStore((s) => s.clearSelectedProduct);
  const reduced = useReducedMotion();

  // Auto-scroll bookkeeping.
  const autoRef = useRef(0); // seconds since the last automatic advance
  const dirRef = useRef(1); // ping-pong direction through the pages

  // Any page change (auto OR manual) restarts the dwell clock, so a manual pick
  // always gets the full interval before the selector moves on its own.
  useEffect(() => {
    autoRef.current = 0;
    if (duoPage >= DUO_PAGE_COUNT - 1) dirRef.current = -1;
    else if (duoPage <= 0) dirRef.current = 1;
  }, [duoPage]);

  // The pair currently mounted. Lags `duoPage` during the flip: we scale the old
  // pair out first, then adopt the new page, then scale the new pair in.
  const [renderPage, setRenderPage] = useState(duoPage);
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const scaleRef = useRef(1);
  const phase = useRef<"idle" | "out" | "in">("idle");

  useFrame((_, delta) => {
    // Auto-scroll the pairs at rest. Paused while a piece is focused or when the
    // guest prefers reduced motion, and only ever fires between flips (idle).
    if (!focused && !reduced && DUO_PAGE_COUNT > 1) {
      autoRef.current += delta;
      if (phase.current === "idle" && autoRef.current >= DUO_AUTO_INTERVAL) {
        autoRef.current = 0;
        const cur = useExperienceStore.getState().duoPage;
        let next = cur + dirRef.current;
        if (next > DUO_PAGE_COUNT - 1) {
          next = DUO_PAGE_COUNT - 2;
          dirRef.current = -1;
        } else if (next < 0) {
          next = 1;
          dirRef.current = 1;
        }
        setDuoPage(next);
      }
    } else {
      autoRef.current = 0;
    }

    if (reduced) {
      // No flip animation — swap instantly and hold full scale.
      if (renderPage !== duoPage) setRenderPage(duoPage);
      scaleRef.current = 1;
    } else {
      if (phase.current === "idle" && duoPage !== renderPage) phase.current = "out";
      if (phase.current === "out") {
        scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, 0, 1 - Math.pow(0.00004, delta));
        if (scaleRef.current < 0.04) {
          scaleRef.current = 0;
          setRenderPage(duoPage);
          phase.current = "in";
        }
      } else if (phase.current === "in") {
        // A fresh page request mid-fade-in restarts the flip.
        if (duoPage !== renderPage) phase.current = "out";
        else {
          scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, 1, 1 - Math.pow(0.005, delta));
          if (scaleRef.current > 0.985) {
            scaleRef.current = 1;
            phase.current = "idle";
          }
        }
      }
    }
    const s = scaleRef.current;
    leftRef.current?.scale.setScalar(s);
    rightRef.current?.scale.setScalar(s);
  });

  const start = renderPage * 2;
  const pair = [
    { product: PRODUCTS[start], ref: leftRef, index: start },
    { product: PRODUCTS[start + 1], ref: rightRef, index: start + 1 },
  ];

  return (
    <group>
      {/* Click-away to exit focus. Sits behind the pieces; they stopPropagation
          their own clicks, so this only fires on empty space. Only present while
          focused, so it never interferes with the rest state. */}
      {focused && (
        <mesh
          position={[0, 0.4, -1]}
          onClick={(e) => {
            e.stopPropagation();
            clearSelectedProduct();
          }}
        >
          <planeGeometry args={[60, 40]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
      {pair.map(({ product, ref, index }) => {
        if (!product) return null;
        const slot = getDuoSlot(index, layout);
        return (
          // Outer group holds the slot position; its scale is animated for the
          // page flip so the piece shrinks/grows in place (not toward centre).
          <group key={product.id} ref={ref} position={slot}>
            <FloatingProductObject
              product={product}
              position={[0, 0, 0]}
              rotationY={-slot[0] * 0.05}
              objectScale={layout.objectScale}
              hitScale={layout.hitScale}
              labelY={layout.labelY}
              labelDistance={layout.labelDistance}
              alwaysLabel
            />
          </group>
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
  const count = PRODUCTS.length;
  const selectProduct = useExperienceStore((s) => s.selectProduct);
  const highlightedId = useExperienceStore((s) => s.highlightedProductId);
  const groupRef = useRef<THREE.Group>(null);
  const posRef = useRef(0); // continuous carousel position (in card units)
  const targetRef = useRef(0); // snapped target index
  const drag = useRef({ startX: 0, base: 0, active: false, moved: 0 });
  const autoRef = useRef(0); // seconds since the last automatic advance
  const dirRef = useRef(1); // ping-pong direction for the auto-advance
  const reduced = useReducedMotion();
  const [focus, setFocus] = useState(0);

  const release = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (drag.current.moved < 0.4) {
      // A tap (not a swipe) → focus the centred piece.
      const i = THREE.MathUtils.clamp(Math.round(posRef.current), 0, count - 1);
      const p = PRODUCTS[i];
      selectProduct({ id: p.id, name: p.name, priceLabel: p.priceLabel });
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

  // When Aurelis names a piece, glide the carousel to it so the highlight is on
  // the centred hero (off-centre cards aren't visible on a phone).
  useEffect(() => {
    if (!highlightedId) return;
    const i = PRODUCTS.findIndex((p) => p.id === highlightedId);
    if (i < 0) return;
    autoRef.current = 0;
    dirRef.current = i >= targetRef.current ? 1 : -1;
    targetRef.current = i;
    setFocus(i);
  }, [highlightedId]);

  useFrame((_, delta) => {
    if (drag.current.active) {
      autoRef.current = 0; // never auto-advance while the guest is dragging
    } else {
      // Auto-advance through the pieces, bouncing back at the ends.
      // Suppressed entirely when the guest prefers reduced motion.
      autoRef.current += delta;
      if (!reduced && count > 1 && autoRef.current >= AUTO_INTERVAL) {
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
      {/* Full-view invisible surface that captures swipe + tap. */}
      <mesh position={[0, 0.4, 2]} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={release}>
        <planeGeometry args={[24, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={groupRef}>
        {PRODUCTS.map((product, index) => (
          <CarouselCard key={product.id} product={product} x={index * GAP} />
        ))}
      </group>

      {/* Dot indicator — also tappable to jump to a piece. */}
      <Html center position={[0, -1.55, 0]} distanceFactor={6} zIndexRange={[30, 0]}>
        <div className="boutique-dots">
          {PRODUCTS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={p.name}
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

function CarouselCard({ product, x }: { product: Product; x: number }) {
  return (
    <group position={[x, 0.55, 0]}>
      <Float speed={1.1} rotationIntensity={0.18} floatIntensity={0.5}>
        <group scale={CARD_SCALE}>
          <ProductObject
            shape={product.shape}
            accent={product.accent}
            cutout={product.cutout}
            model={product.model}
            heroRotation={product.heroRotation}
            modelScale={product.modelScale}
            spin={product.animate ?? true}
          />
        </group>
      </Float>
      <Html center position={[0, -1.35, 0]} distanceFactor={4.4} zIndexRange={[8, 0]} style={{ pointerEvents: "none" }}>
        <div className="scene-label">
          <span className="scene-label__name">{product.name}</span>
          <span className="scene-label__hint">{product.priceLabel}</span>
        </div>
      </Html>
    </group>
  );
}
