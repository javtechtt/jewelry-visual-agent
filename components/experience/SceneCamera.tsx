"use client";

// Camera director. Lives inside the Canvas and tweens the camera every frame:
// - Rest: the boutique framing (the collection), with subtle pointer parallax.
// - Focus: when a piece is selected (arc views only — portrait uses the swipe
//   carousel), it DOLLIES in front of that piece so the guest gets close, with
//   parallax muted so the close-up doesn't wobble.
// The base position is lerped slowly (a ~1s cinematic dolly) while parallax is
// applied on top each frame so it stays responsive without smearing the dolly.

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { DUO_LAYOUT, getDuoSlot, getSceneCamera, PARALLAX } from "@/config/scenes";
import { FOCUS } from "@/config/motion";
import { PRODUCTS } from "@/config/products";
import type { Vec3 } from "@/types/experience";

export default function SceneCamera() {
  const scene = useExperienceStore((s) => s.scene);
  const view = useExperienceStore((s) => s.view);
  const selectedId = useExperienceStore((s) => s.selectedProduct?.id);
  const { camera, pointer } = useThree();
  const reduced = useReducedMotion();

  const basePos = useMemo(() => new THREE.Vector3(), []);
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const currentLook = useMemo(() => new THREE.Vector3(0, 0.35, 0), []);
  const initialized = useRef(false);

  useFrame((_, delta) => {
    const rest = getSceneCamera(scene, view);
    // Focus applies on the arc (desktop/landscape); portrait uses the carousel.
    const focusIdx =
      selectedId && view !== "portrait" ? PRODUCTS.findIndex((p) => p.id === selectedId) : -1;
    const focused = focusIdx >= 0;

    let camPos: Vec3;
    let camTarget: Vec3;
    let camFov: number;
    if (focused) {
      const pos = getDuoSlot(focusIdx, DUO_LAYOUT[view]);
      const py = pos[1] + 0.32; // look at the piece body, a touch above the arc line
      camPos = [pos[0], py + 0.12, pos[2] + FOCUS.cameraDistance];
      camTarget = [pos[0], py, pos[2]];
      camFov = FOCUS.cameraFov;
    } else {
      camPos = rest.position;
      camTarget = rest.target;
      camFov = rest.fov;
    }

    // Soft ~1s dolly for the base move; snap on first mount and reduced motion.
    targetPos.set(camPos[0], camPos[1], camPos[2]);
    if (!initialized.current) {
      basePos.copy(targetPos);
      currentLook.set(camTarget[0], camTarget[1], camTarget[2]);
      (camera as THREE.PerspectiveCamera).fov = camFov;
      initialized.current = true;
    }
    const k = reduced ? 1 : 1 - Math.pow(0.05, delta);
    basePos.lerp(targetPos, k);

    // Parallax on top of the settled base — muted while focused.
    const gain = focused ? 0.22 : 1;
    camera.position.copy(basePos);
    camera.position.x += pointer.x * PARALLAX.maxYaw * 4 * gain;
    camera.position.y += pointer.y * PARALLAX.maxPitch * 4 * gain;

    const perspective = camera as THREE.PerspectiveCamera;
    perspective.fov = THREE.MathUtils.lerp(perspective.fov, camFov, k);
    perspective.updateProjectionMatrix();

    lookTarget.set(camTarget[0], camTarget[1], camTarget[2]);
    currentLook.lerp(lookTarget, k);
    camera.lookAt(currentLook);
  });

  return null;
}
