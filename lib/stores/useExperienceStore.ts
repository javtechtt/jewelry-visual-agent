"use client";

// Single source of truth for the experience: which scene is active, the focused
// category/product, Aurelis' agent state, the open demo flow, and voice status.
// Both the 3D scene and the DOM overlays subscribe to this store, and all voice
// + click + text commands funnel through runCommand().

import { create } from "zustand";
import type {
  AgentState,
  DemoFlowId,
  SceneId,
  SelectedProduct,
} from "@/types/experience";
import type { CategoryId } from "@/types/category";
import type { CommandId, MatchedIntent, RealtimeStatus } from "@/types/voice";
import type { CartItem, DemoReceipt } from "@/types/demo";
import type { ViewMode } from "@/config/responsive";
import { AGENT } from "@/config/agent";
import { CATEGORY_MAP } from "@/config/categories";

/** How long Aurelis stays in the "speaking" state after emitting a caption. */
const SPEAK_MS = 2800;
let speakTimer: ReturnType<typeof setTimeout> | null = null;

export interface ExperienceState {
  // --- core scene state ---
  scene: SceneId;
  activeCategory: CategoryId | null;
  hoveredCategory: CategoryId | null;
  focusedOptionId: string | null;

  // --- responsive view mode (drives the 3D scene presets only) ---
  view: ViewMode;

  // --- agent + voice ---
  agentState: AgentState;
  realtimeStatus: RealtimeStatus;
  micActive: boolean;
  caption: string;
  textFallbackOpen: boolean;

  // --- selection + cart + demo ---
  selectedProduct: SelectedProduct | null;
  cart: CartItem[];
  demoFlow: DemoFlowId | null;
  lastReceipt: DemoReceipt | null;

  // --- primitive setters ---
  setScene: (scene: SceneId) => void;
  setView: (view: ViewMode) => void;
  setHoveredCategory: (id: CategoryId | null) => void;
  setFocusedOption: (id: string | null) => void;
  setAgentState: (state: AgentState) => void;
  setRealtimeStatus: (status: RealtimeStatus) => void;
  setMicActive: (active: boolean) => void;
  toggleMic: () => void;
  setCaption: (caption: string) => void;
  speak: (caption: string) => void;
  setTextFallbackOpen: (open: boolean) => void;
  toggleTextFallback: () => void;
  setReceipt: (receipt: DemoReceipt | null) => void;

  // --- cart (the system's order source of truth) ---
  addToCart: (item: Omit<CartItem, "qty">) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;

  // --- high-level experience actions ---
  enterCategory: (id: CategoryId) => void;
  selectProduct: (product: SelectedProduct) => void;
  openDemoFlow: (flow: DemoFlowId) => void;
  closeDemoFlow: () => void;
  backToBoutique: () => void;
  startOver: () => void;
  runCommand: (
    intent: MatchedIntent | { command: CommandId; category?: CategoryId; demoFlow?: DemoFlowId },
  ) => void;
}

const INITIAL = {
  scene: "boutique-window" as SceneId,
  view: "desktop" as ViewMode,
  activeCategory: null as CategoryId | null,
  hoveredCategory: null as CategoryId | null,
  focusedOptionId: null as string | null,
  agentState: "idle" as AgentState,
  realtimeStatus: "idle" as RealtimeStatus,
  micActive: false,
  caption: AGENT.lines.greeting,
  textFallbackOpen: false,
  selectedProduct: null as SelectedProduct | null,
  cart: [] as CartItem[],
  demoFlow: null as DemoFlowId | null,
  lastReceipt: null as DemoReceipt | null,
};

export const useExperienceStore = create<ExperienceState>((set, get) => ({
  ...INITIAL,

  setScene: (scene) => set({ scene }),
  setView: (view) => set({ view }),
  setHoveredCategory: (hoveredCategory) => set({ hoveredCategory }),
  setFocusedOption: (focusedOptionId) => set({ focusedOptionId }),
  setAgentState: (agentState) => set({ agentState }),
  setRealtimeStatus: (realtimeStatus) => set({ realtimeStatus }),
  setMicActive: (micActive) =>
    set({ micActive, agentState: micActive ? "listening" : "idle" }),
  toggleMic: () => get().setMicActive(!get().micActive),
  setCaption: (caption) => set({ caption }),

  speak: (caption) => {
    if (speakTimer) clearTimeout(speakTimer);
    set({ caption, agentState: "speaking" });
    speakTimer = setTimeout(() => {
      // Return to listening if the mic is still open, otherwise idle.
      set({ agentState: get().micActive ? "listening" : "idle" });
    }, SPEAK_MS);
  },

  setTextFallbackOpen: (textFallbackOpen) => set({ textFallbackOpen }),
  toggleTextFallback: () => set({ textFallbackOpen: !get().textFallbackOpen }),
  setReceipt: (lastReceipt) => set({ lastReceipt }),

  enterCategory: (id) => {
    const category = CATEGORY_MAP[id];
    if (!category) return;
    set({
      scene: "luminous-atelier",
      activeCategory: id,
      focusedOptionId: null,
      agentState: "thinking",
    });
    get().speak(AGENT.lines.enterCategory(category.label));
  },

  selectProduct: (product) => {
    set({ selectedProduct: product, focusedOptionId: product.id });
    get().speak(AGENT.lines.selectProduct(product.name));
  },

  addToCart: (item) =>
    set((s) => {
      const existing = s.cart.find((c) => c.id === item.id);
      const cart = existing
        ? s.cart.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
        : [...s.cart, { ...item, qty: 1 }];
      return { cart };
    }),
  removeFromCart: (id) => set((s) => ({ cart: s.cart.filter((c) => c.id !== id) })),
  clearCart: () => set({ cart: [] }),

  openDemoFlow: (flow) => {
    set({ demoFlow: flow });
    const line =
      flow === "checkout"
        ? AGENT.lines.checkout
        : flow === "booking"
          ? AGENT.lines.booking
          : flow === "lead"
            ? AGENT.lines.lead
            : AGENT.lines.handoff;
    get().speak(line);
  },

  closeDemoFlow: () => set({ demoFlow: null }),

  backToBoutique: () => {
    set({
      scene: "boutique-window",
      activeCategory: null,
      selectedProduct: null,
      focusedOptionId: null,
      demoFlow: null,
      agentState: "speaking",
    });
    get().speak(AGENT.lines.back);
  },

  startOver: () => {
    if (speakTimer) clearTimeout(speakTimer);
    // Preserve the live responsive view — it's a device characteristic, not
    // experience state, so a reset must not snap mobile back to the desktop preset.
    set({ ...INITIAL, view: get().view, caption: AGENT.lines.reset });
    get().speak(AGENT.lines.reset);
  },

  runCommand: (intent) => {
    switch (intent.command) {
      case "show-category":
        if (intent.category) get().enterCategory(intent.category);
        break;
      case "book-appointment":
        get().openDemoFlow("booking");
        break;
      case "start-checkout":
        get().openDemoFlow("checkout");
        break;
      case "connect-human":
        get().openDemoFlow("handoff");
        break;
      case "request-info":
        get().openDemoFlow("lead");
        break;
      case "back-to-boutique":
        get().backToBoutique();
        break;
      case "start-over":
        get().startOver();
        break;
      default:
        get().speak(AGENT.lines.unknown);
    }
  },
}));
