// Core experience state vocabulary shared across the scene, store and overlays.

/** The single cinematic screen — the boutique home page (the showcase). */
export type SceneId = "boutique-window";

/** Aurelis concierge presence state — drives orb animation + caption tone. */
export type AgentState = "idle" | "listening" | "thinking" | "speaking";

/** Demo-safe flows. Each feels real in the UI but performs no real action. */
export type DemoFlowId = "checkout";

/** A piece the guest has focused/selected in the boutique. */
export interface SelectedProduct {
  id: string;
  name: string;
  priceLabel: string;
}

/** [x, y, z] tuple helper for camera + object placement. */
export type Vec3 = [number, number, number];
