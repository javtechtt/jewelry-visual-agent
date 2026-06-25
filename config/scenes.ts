// Camera-ready scene architecture. SceneCamera tweens between these configs so
// moving from the Boutique Window to the Luminous Atelier feels like a cinematic
// dolly, not a page navigation.

import type { SceneId, Vec3 } from "@/types/experience";
import type { ViewMode } from "@/config/responsive";

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
    // Sits back among the orbiting panel ring (offset to z = -0.3 in
    // LuminousAtelierScene) so the orb reads as nested in the centre of the
    // panels rather than floating in front of them.
    orb: { position: [0, 0.45, -0.7], scale: 1.15 },
    atmosphere: { top: "#fdfaf4", bottom: "#f0e9f2" },
  },
};

/** Subtle pointer-driven parallax range (radians) applied on top of the camera. */
export const PARALLAX = {
  maxYaw: 0.06,
  maxPitch: 0.035,
  damping: 2.2,
};

// ============================================================================
// RESPONSIVE SCENE PRESETS
//
// `desktop` always points at the approved values above, so the large-screen
// composition is provably unchanged. `landscape` (non-desktop, wider-than-tall)
// and `portrait` (taller-than-wide) presets only widen the framing / re-space
// the objects so nothing is cut off on tablets and phones. Tune these freely —
// they never touch the desktop preset.
// ============================================================================

interface SceneView {
  camera: CameraConfig;
  orb: { position: Vec3; scale: number };
}

const SCENE_VIEWS: Record<SceneId, Record<ViewMode, SceneView>> = {
  "boutique-window": {
    // Desktop — references the source-of-truth values; do not change.
    desktop: {
      camera: SCENES["boutique-window"].camera,
      orb: SCENES["boutique-window"].orb,
    },
    // Landscape tablet / small landscape screens: pull back + a touch more FOV
    // so the (slightly tighter) horizontal arc clears narrower aspect ratios.
    landscape: {
      camera: { position: [0, 0.6, 9.8], target: [0, 0.32, 0], fov: 46 },
      orb: { position: [0, 1.95, -1.4], scale: 0.58 },
    },
    // Portrait phones / portrait tablets: the categories restack into a gentle
    // vertical S-curve (see BoutiqueWindowScene), so the camera frames height.
    portrait: {
      camera: { position: [0, 0.35, 6.8], target: [0, 0.15, 0], fov: 48 },
      orb: { position: [0, 1.5, -1.7], scale: 0.5 },
    },
  },
  "luminous-atelier": {
    desktop: {
      camera: SCENES["luminous-atelier"].camera,
      orb: SCENES["luminous-atelier"].orb,
    },
    landscape: {
      camera: { position: [0, 0.4, 7.4], target: [0, 0.42, 0], fov: 44 },
      orb: { position: [0, 0.45, -0.7], scale: 1.0 },
    },
    portrait: {
      camera: { position: [0, 0.4, 8.6], target: [0, 0.45, 0], fov: 46 },
      orb: { position: [0, 0.5, -0.7], scale: 0.74 },
    },
  },
};

export function getSceneCamera(scene: SceneId, view: ViewMode): CameraConfig {
  return SCENE_VIEWS[scene][view].camera;
}

export function getSceneOrb(scene: SceneId, view: ViewMode): SceneView["orb"] {
  return SCENE_VIEWS[scene][view].orb;
}

/** Boutique Window object arrangement, per view. Desktop reproduces the
 *  original horizontal arc exactly (SPREAD 9.6, full-scale objects). */
export interface BoutiqueLayout {
  /** Portrait stacks vertically; landscape/desktop keep the horizontal arc. */
  vertical: boolean;
  /** Total horizontal width of the arc (horizontal modes). */
  spread: number;
  /** Total vertical extent of the column (portrait mode). */
  vSpread: number;
  /** Lateral S-curve amplitude in portrait. */
  zig: number;
  /** Visual product scale multiplier. */
  objectScale: number;
  /** Tap-target (hit plane) scale multiplier — kept generous on touch. */
  hitScale: number;
  /** Label vertical offset below each product. */
  labelY: number;
}

export const BOUTIQUE_LAYOUT: Record<ViewMode, BoutiqueLayout> = {
  desktop: { vertical: false, spread: 9.6, vSpread: 0, zig: 0, objectScale: 1, hitScale: 1, labelY: -0.95 },
  landscape: { vertical: false, spread: 7.2, vSpread: 0, zig: 0, objectScale: 0.92, hitScale: 1.05, labelY: -0.92 },
  portrait: { vertical: true, spread: 0, vSpread: 4.7, zig: 0.55, objectScale: 0.74, hitScale: 1.3, labelY: -0.86 },
};

/** Luminous Atelier ring layout, per view. Desktop reproduces the original
 *  ring (radius 2.7, full-scale options). */
export interface AtelierLayout {
  ringRadius: number;
  optionScale: number;
  /** Category title plate height + perspective scale. */
  titleY: number;
  titleDistance: number;
}

export const ATELIER_LAYOUT: Record<ViewMode, AtelierLayout> = {
  desktop: { ringRadius: 2.7, optionScale: 1, titleY: 2.2, titleDistance: 9 },
  landscape: { ringRadius: 2.1, optionScale: 0.92, titleY: 2.05, titleDistance: 10 },
  portrait: { ringRadius: 1.2, optionScale: 0.8, titleY: 1.85, titleDistance: 12 },
};
