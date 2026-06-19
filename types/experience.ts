// Core experience state vocabulary shared across the scene, store and overlays.

import type { CategoryId } from "./category";

/** The two cinematic screens. Transitions are camera-driven, not page nav. */
export type SceneId = "boutique-window" | "luminous-atelier";

/** Aurelis concierge presence state — drives orb animation + caption tone. */
export type AgentState = "idle" | "listening" | "thinking" | "speaking";

/** Demo-safe flows. Each feels real in the UI but performs no real action. */
export type DemoFlowId = "checkout" | "booking" | "lead" | "handoff";

/** A product the guest has focused/selected inside the Luminous Atelier. */
export interface SelectedProduct {
  id: string;
  categoryId: CategoryId;
  name: string;
  priceLabel: string;
}

/** [x, y, z] tuple helper for camera + object placement. */
export type Vec3 = [number, number, number];
