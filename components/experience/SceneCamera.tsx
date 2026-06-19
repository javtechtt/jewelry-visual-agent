"use client";

// Camera-ready scene architecture. Lives inside the Canvas and tweens the
// camera toward the active scene's config (position, look-target, fov) every
// frame, so switching scenes reads as a cinematic dolly — not a page nav. Adds
// a subtle pointer parallax on top for a living, hand-held feel.

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { getSceneCamera, PARALLAX } from "@/config/scenes";

export default function SceneCamera() {
  const scene = useExperienceStore((s) => s.scene);
  const view = useExperienceStore((s) => s.view);
  const { camera, pointer } = useThree();

  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const currentLook = useMemo(() => new THREE.Vector3(0, 0.35, 0), []);

  useFrame((_, delta) => {
    // Camera config resolves per responsive view; desktop is the original value.
    const cam = getSceneCamera(scene, view);
    const k = 1 - Math.pow(0.0001, delta);

    targetPos.set(cam.position[0], cam.position[1], cam.position[2]);
    // Subtle pointer parallax (world-space nudge).
    targetPos.x += pointer.x * PARALLAX.maxYaw * 4;
    targetPos.y += pointer.y * PARALLAX.maxPitch * 4;
    camera.position.lerp(targetPos, k);

    const perspective = camera as THREE.PerspectiveCamera;
    perspective.fov = THREE.MathUtils.lerp(perspective.fov, cam.fov, k);
    perspective.updateProjectionMatrix();

    lookTarget.set(cam.target[0], cam.target[1], cam.target[2]);
    currentLook.lerp(lookTarget, k);
    camera.lookAt(currentLook);
  });

  return null;
}
