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
      // Pulled in from z 8.4 so the pieces read present (not distant specks in a
      // void), while keeping all six in frame; the focus tool dollies closer
      // still on select.
      position: [0, 0.55, 7.5],
      target: [0, 0.35, 0],
      fov: 40,
    },
    // Orb scaled down to compensate for the closer camera so it stays a quiet
    // presence rather than dominating the frame.
    orb: { position: [0, 2.0, -1.6], scale: 0.5 },
    // Warm champagne-ivory, deliberately BELOW paper-white. `top` is both the
    // canvas background and the back wall; `bottom` is the floor and the fog.
    // Pushing these toward pure white was the main cause of the blown-out look.
    atmosphere: { top: "#ece2d2", bottom: "#ddd0bd" },
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
// `desktop` references the approved SCENES values above. `landscape`
// (wider-than-tall, non-desktop) and `portrait` (taller-than-wide) presets
// re-frame so nothing is cut off on tablets and phones. Tune these freely.
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
      camera: { position: [0, 0.5, 9.0], target: [0, 0.28, 0], fov: 48 },
      orb: { position: [0, 1.95, -1.7], scale: 0.44 },
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
  desktop: { spread: 7.4, objectScale: 1.06, hitScale: 1, labelY: -0.9, labelStagger: 0.52, labelDistance: 10 },
  landscape: { spread: 7.8, objectScale: 0.78, hitScale: 1.05, labelY: -0.72, labelStagger: 0.44, labelDistance: 5.6 },
  // Portrait isn't an arc — BoutiqueWindowScene routes it to the swipe carousel,
  // so these values are unused there (kept only to satisfy the per-view record).
  portrait: { spread: 0, objectScale: 0.5, hitScale: 1.3, labelY: -0.5, labelStagger: 0, labelDistance: 3.6 },
};

/** The arc position of a piece (index of count) on the boutique home page —
 *  shared by BoutiqueWindowScene (layout) and SceneCamera (focus target) so the
 *  formula never drifts between them. */
export function getArcPosition(index: number, count: number, layout: BoutiqueLayout): Vec3 {
  const t = count > 1 ? index / (count - 1) : 0.5;
  const x = (t - 0.5) * layout.spread;
  const z = -Math.abs(x) * 0.18; // curve the ends gently away
  return [x, 0.3, z];
}
