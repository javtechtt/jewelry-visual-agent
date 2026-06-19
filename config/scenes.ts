// Camera-ready scene architecture. SceneCamera tweens between these configs so
// moving from the Boutique Window to the Luminous Atelier feels like a cinematic
// dolly, not a page navigation.

import type { SceneId, Vec3 } from "@/types/experience";

export interface CameraConfig {
  position: Vec3;
  target: Vec3;
  fov: number;
}

export interface SceneDef {
  id: SceneId;
  name: string;
  camera: CameraConfig;
  /** Aurelis orb placement + scale for this scene. */
  orb: { position: Vec3; scale: number };
  /** Background gradient stops (top, bottom) for the light premium atmosphere. */
  atmosphere: { top: string; bottom: string };
}

export const SCENES: Record<SceneId, SceneDef> = {
  "boutique-window": {
    id: "boutique-window",
    name: "Boutique Window",
    camera: {
      position: [0, 0.65, 8.4],
      target: [0, 0.35, 0],
      fov: 42,
    },
    orb: { position: [0, 1.95, -1.4], scale: 0.62 },
    atmosphere: { top: "#fbf7f0", bottom: "#efe6da" },
  },
  "luminous-atelier": {
    id: "luminous-atelier",
    name: "Luminous Atelier",
    camera: {
      position: [0, 0.35, 5.6],
      target: [0, 0.45, 0],
      fov: 40,
    },
    orb: { position: [0, 0.45, 0], scale: 1.25 },
    atmosphere: { top: "#fdfaf4", bottom: "#f0e9f2" },
  },
};

/** Subtle pointer-driven parallax range (radians) applied on top of the camera. */
export const PARALLAX = {
  maxYaw: 0.06,
  maxPitch: 0.035,
  damping: 2.2,
};
