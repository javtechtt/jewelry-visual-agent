// Camera-ready scene config for the single boutique home page. SceneCamera holds
// the camera on these values (with a subtle pointer parallax); the responsive
// presets below only re-frame for tablets/phones — desktop is unchanged.

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
    name: "Boutique",
    camera: {
      position: [0, 0.65, 8.4],
      target: [0, 0.35, 0],
      fov: 42,
    },
    orb: { position: [0, 1.95, -1.4], scale: 0.62 },
    atmosphere: { top: "#fbf7f0", bottom: "#efe6da" },
  },
};

/** Subtle pointer-driven parallax range (radians) applied on top of the camera. */
export const PARALLAX = {
  maxYaw: 0.06,
  maxPitch: 0.035,
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
      camera: { position: [0, 0.5, 10.4], target: [0, 0.28, 0], fov: 50 },
      orb: { position: [0, 1.95, -1.7], scale: 0.5 },
    },
    // Portrait phones / portrait tablets: the pieces become a swipe carousel
    // (see BoutiqueWindowScene), so the camera frames a single centred hero.
    portrait: {
      camera: { position: [0, 0.4, 9.2], target: [0, 0.4, 0], fov: 44 },
      orb: { position: [0, 3.05, -3.4], scale: 0.26 },
    },
  },
};

export function getSceneCamera(scene: SceneId, view: ViewMode): CameraConfig {
  return SCENE_VIEWS[scene][view].camera;
}

export function getSceneOrb(scene: SceneId, view: ViewMode): SceneView["orb"] {
  return SCENE_VIEWS[scene][view].orb;
}

/** Boutique arc arrangement (desktop/landscape; portrait uses the swipe
 *  carousel in BoutiqueWindowScene, not these values). */
export interface BoutiqueLayout {
  /** Total horizontal width of the arc. */
  spread: number;
  /** Visual product scale multiplier. */
  objectScale: number;
  /** Tap-target (hit plane) scale multiplier — kept generous on touch. */
  hitScale: number;
  /** Label vertical offset below each product. */
  labelY: number;
  /** Extra drop applied to every other label so long product names on the arc
   *  never collide with their neighbours. */
  labelStagger: number;
  /** Html distanceFactor for piece labels (smaller = smaller on screen). */
  labelDistance: number;
}

export const BOUTIQUE_LAYOUT: Record<ViewMode, BoutiqueLayout> = {
  desktop: { spread: 8.6, objectScale: 0.94, hitScale: 1, labelY: -0.9, labelStagger: 0.52, labelDistance: 10 },
  landscape: { spread: 8.8, objectScale: 0.66, hitScale: 1.05, labelY: -0.72, labelStagger: 0.44, labelDistance: 5.6 },
  // Portrait isn't an arc — BoutiqueWindowScene routes it to the swipe carousel,
  // so these values are unused there (kept only to satisfy the per-view record).
  portrait: { spread: 0, objectScale: 0.5, hitScale: 1.3, labelY: -0.5, labelStagger: 0, labelDistance: 3.6 },
};
