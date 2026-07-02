"use client";

// Single source of truth for the experience: the focused piece, the bag,
// Aurelis' agent state, the checkout flow, and voice status. Both the 3D scene
// and the DOM overlays subscribe to this store, and all voice + click + text
// commands funnel through runCommand(). The boutique is a single home page — the
// guest selects a piece and the agent guides them to checkout (no categories).

import { create } from "zustand";
import type {
  AgentState,
  DemoFlowId,
  SceneId,
  SelectedProduct,
} from "@/types/experience";
import type { CommandId, MatchedIntent, RealtimeStatus } from "@/types/voice";
import type {
  CardDetails,
  CartItem,
  CheckoutForm,
  CheckoutStep,
  DemoReceipt,
} from "@/types/demo";
import type { ViewMode } from "@/config/responsive";
import { AGENT } from "@/config/agent";
import { PRODUCT_MAP } from "@/config/products";
import { cartTotalLabel } from "@/lib/cart";
import { runCheckout } from "@/lib/demo/demoActions";
import { isEmail } from "@/lib/demo/demoValidation";

/** How long Aurelis stays in the "speaking" state after emitting a caption. */
const SPEAK_MS = 2800;
let speakTimer: ReturnType<typeof setTimeout> | null = null;

/** How long a field stays "just filled by Aurelis" highlighted. */
const FILL_HIGHLIGHT_MS = 1400;
let fillTimer: ReturnType<typeof setTimeout> | null = null;

/** How long a piece glows when Aurelis names it while suggesting. */
const PRODUCT_HIGHLIGHT_MS = 1600;
let highlightTimer: ReturnType<typeof setTimeout> | null = null;

const EMPTY_CHECKOUT: CheckoutForm = {
  name: "",
  email: "",
  phone: "",
  paymentMethod: "card",
  consent: false,
};

const EMPTY_CARD: CardDetails = { number: "", exp: "", cvc: "" };

export interface ExperienceState {
  // --- core scene state (single home scene) ---
  scene: SceneId;

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
  /** Piece momentarily glowing because Aurelis just named it aloud. */
  highlightedProductId: string | null;
  cart: CartItem[];
  demoFlow: DemoFlowId | null;
  lastReceipt: DemoReceipt | null;

  // --- live checkout (the agent fills this in real time via tools) ---
  checkout: CheckoutForm;
  checkoutStep: CheckoutStep;
  /** Field names just written by Aurelis — drives a brief on-screen highlight. */
  checkoutFilled: string[];
  /** Card entry — held here so the agent can fill it; never transmitted. */
  checkoutCard: CardDetails;

  // --- primitive setters ---
  setView: (view: ViewMode) => void;
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

  // --- checkout (system-owned; agent + UI both write through these) ---
  updateCheckout: (patch: Partial<CheckoutForm>, fromAgent?: boolean) => void;
  updateCard: (patch: Partial<CardDetails>, fromAgent?: boolean) => void;
  setCheckoutStep: (step: CheckoutStep) => void;
  resetCheckout: () => void;
  placeOrder: () => Promise<void>;

  // --- high-level experience actions ---
  selectProduct: (product: SelectedProduct) => void;
  /** Briefly glow a piece (Aurelis named it) — auto-clears. */
  highlightProduct: (id: string) => void;
  openDemoFlow: (flow: DemoFlowId) => void;
  closeDemoFlow: () => void;
  startOver: () => void;
  runCommand: (intent: MatchedIntent | { command: CommandId; productId?: string }) => void;
}

const INITIAL = {
  scene: "boutique-window" as SceneId,
  view: "desktop" as ViewMode,
  agentState: "idle" as AgentState,
  realtimeStatus: "idle" as RealtimeStatus,
  micActive: false,
  caption: AGENT.lines.greeting,
  textFallbackOpen: false,
  selectedProduct: null as SelectedProduct | null,
  highlightedProductId: null as string | null,
  cart: [] as CartItem[],
  demoFlow: null as DemoFlowId | null,
  lastReceipt: null as DemoReceipt | null,
  checkout: EMPTY_CHECKOUT,
  checkoutStep: "details" as CheckoutStep,
  checkoutFilled: [] as string[],
  checkoutCard: EMPTY_CARD,
};

export const useExperienceStore = create<ExperienceState>((set, get) => ({
  ...INITIAL,

  setView: (view) => set({ view }),
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

  selectProduct: (product) => {
    set({ selectedProduct: product });
    get().speak(AGENT.lines.selectProduct(product.name));
  },

  highlightProduct: (id) => {
    if (highlightTimer) clearTimeout(highlightTimer);
    set({ highlightedProductId: id });
    highlightTimer = setTimeout(() => set({ highlightedProductId: null }), PRODUCT_HIGHLIGHT_MS);
  },

  addToCart: (item) =>
    set((s) => {
      const existing = s.cart.find((c) => c.id === item.id);
      const cart = existing
        ? s.cart.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
        : [...s.cart, { ...item, qty: 1 }];
      return { cart };
    }),
  removeFromCart: (id) => {
    set((s) => ({ cart: s.cart.filter((c) => c.id !== id) }));
    // If the guest empties the bag mid-checkout, there's nothing to buy — gently
    // leave checkout rather than strand them on a dead Pay button + empty summary.
    const s = get();
    if (s.cart.length === 0 && s.demoFlow === "checkout") s.closeDemoFlow();
  },
  clearCart: () => set({ cart: [] }),

  updateCheckout: (patch, fromAgent = false) => {
    set((s) => ({ checkout: { ...s.checkout, ...patch } }));
    if (fromAgent) {
      // Briefly highlight the fields Aurelis just wrote, then let them settle.
      if (fillTimer) clearTimeout(fillTimer);
      set({ checkoutFilled: Object.keys(patch) });
      fillTimer = setTimeout(() => set({ checkoutFilled: [] }), FILL_HIGHLIGHT_MS);
    } else {
      set({ checkoutFilled: [] });
    }
  },

  updateCard: (patch, fromAgent = false) => {
    set((s) => ({ checkoutCard: { ...s.checkoutCard, ...patch } }));
    if (fromAgent) {
      if (fillTimer) clearTimeout(fillTimer);
      set({ checkoutFilled: Object.keys(patch) });
      fillTimer = setTimeout(() => set({ checkoutFilled: [] }), FILL_HIGHLIGHT_MS);
    } else {
      set({ checkoutFilled: [] });
    }
  },

  setCheckoutStep: (checkoutStep) => set({ checkoutStep }),

  resetCheckout: () =>
    set({
      checkout: EMPTY_CHECKOUT,
      checkoutStep: "details",
      checkoutFilled: [],
      checkoutCard: EMPTY_CARD,
    }),

  placeOrder: async () => {
    const { cart, checkout } = get();
    if (cart.length === 0) return;
    // Defense-in-depth: never finalize an order without complete contact details,
    // whatever route reached this point (voice tool, Pay button, off-script turn).
    if (!checkout.name.trim() || !isEmail(checkout.email) || !checkout.phone.trim()) return;
    // Placing the order implies acceptance of the on-screen Terms of Sale.
    set({ checkoutStep: "processing", checkout: { ...checkout, consent: true } });
    const total = cartTotalLabel(cart);
    const receipt = await runCheckout({
      name: checkout.name,
      email: checkout.email,
      phone: checkout.phone,
      paymentMethod: checkout.paymentMethod,
      consent: true,
      items: cart.map((c) => ({ name: c.name, priceLabel: c.priceLabel, qty: c.qty })),
      total,
    });
    set({ lastReceipt: receipt, cart: [], checkoutStep: "confirmation" });
  },

  openDemoFlow: (flow) => {
    get().resetCheckout();
    set({ demoFlow: flow });
    get().speak(AGENT.lines.checkout);
  },

  closeDemoFlow: () => {
    set({ demoFlow: null });
    // Drop any captured contact details once the panel is dismissed.
    get().resetCheckout();
  },

  startOver: () => {
    if (speakTimer) clearTimeout(speakTimer);
    if (highlightTimer) clearTimeout(highlightTimer);
    // Preserve the live responsive view — it's a device characteristic, not
    // experience state, so a reset must not snap mobile back to the desktop preset.
    set({ ...INITIAL, view: get().view, caption: AGENT.lines.reset });
    get().speak(AGENT.lines.reset);
  },

  runCommand: (intent) => {
    switch (intent.command) {
      case "select-product": {
        const product = intent.productId ? PRODUCT_MAP[intent.productId] : undefined;
        if (product) {
          get().selectProduct({ id: product.id, name: product.name, priceLabel: product.priceLabel });
        }
        break;
      }
      case "start-checkout":
        get().openDemoFlow("checkout");
        break;
      case "start-over":
        get().startOver();
        break;
      default:
        get().speak(AGENT.lines.unknown);
    }
  },
}));
