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
import type {
  BookingForm,
  BookingStep,
  CardDetails,
  CartItem,
  CheckoutForm,
  CheckoutStep,
  DemoReceipt,
} from "@/types/demo";
import type { ViewMode } from "@/config/responsive";
import { AGENT } from "@/config/agent";
import { CATEGORY_MAP } from "@/config/categories";
import { cartTotalLabel } from "@/lib/cart";
import { runBooking, runCheckout } from "@/lib/demo/demoActions";

/** How long Aurelis stays in the "speaking" state after emitting a caption. */
const SPEAK_MS = 2800;
let speakTimer: ReturnType<typeof setTimeout> | null = null;

/** How long a field stays "just filled by Aurelis" highlighted. */
const FILL_HIGHLIGHT_MS = 1400;
let fillTimer: ReturnType<typeof setTimeout> | null = null;
let bookingFillTimer: ReturnType<typeof setTimeout> | null = null;

const EMPTY_CHECKOUT: CheckoutForm = {
  name: "",
  email: "",
  phone: "",
  paymentMethod: "card",
  consent: false,
};

const EMPTY_CARD: CardDetails = { number: "", exp: "", cvc: "" };

const EMPTY_BOOKING: BookingForm = {
  service: "",
  date: "",
  time: "",
  name: "",
  email: "",
  phone: "",
  notes: "",
};

/** Human-readable service name for the active category (or a general visit). */
function serviceLabel(categoryId: CategoryId | null): string {
  return categoryId ? `${CATEGORY_MAP[categoryId].label} consultation` : "Private appointment";
}

export interface ExperienceState {
  // --- core scene state ---
  scene: SceneId;
  activeCategory: CategoryId | null;

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

  // --- live checkout (the agent fills this in real time via tools) ---
  checkout: CheckoutForm;
  checkoutStep: CheckoutStep;
  /** Field names just written by Aurelis — drives a brief on-screen highlight. */
  checkoutFilled: string[];
  /** Card entry — held here so the agent can fill it; never transmitted. */
  checkoutCard: CardDetails;

  // --- live appointment booking (also agent-fillable) ---
  booking: BookingForm;
  bookingStep: BookingStep;
  bookingFilled: string[];

  // --- primitive setters ---
  setScene: (scene: SceneId) => void;
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

  // --- booking (system-owned; agent + UI both write through these) ---
  updateBooking: (patch: Partial<BookingForm>, fromAgent?: boolean) => void;
  setBookingStep: (step: BookingStep) => void;
  resetBooking: () => void;
  confirmBooking: () => Promise<void>;

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
  agentState: "idle" as AgentState,
  realtimeStatus: "idle" as RealtimeStatus,
  micActive: false,
  caption: AGENT.lines.greeting,
  textFallbackOpen: false,
  selectedProduct: null as SelectedProduct | null,
  cart: [] as CartItem[],
  demoFlow: null as DemoFlowId | null,
  lastReceipt: null as DemoReceipt | null,
  checkout: EMPTY_CHECKOUT,
  checkoutStep: "details" as CheckoutStep,
  checkoutFilled: [] as string[],
  checkoutCard: EMPTY_CARD,
  booking: EMPTY_BOOKING,
  bookingStep: "schedule" as BookingStep,
  bookingFilled: [] as string[],
};

export const useExperienceStore = create<ExperienceState>((set, get) => ({
  ...INITIAL,

  setScene: (scene) => set({ scene }),
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

  enterCategory: (id) => {
    const category = CATEGORY_MAP[id];
    if (!category) return;
    set({
      scene: "luminous-atelier",
      activeCategory: id,
      agentState: "thinking",
    });
    get().speak(AGENT.lines.enterCategory(category.label));
  },

  selectProduct: (product) => {
    set({ selectedProduct: product });
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

  updateBooking: (patch, fromAgent = false) => {
    set((s) => ({ booking: { ...s.booking, ...patch } }));
    if (fromAgent) {
      if (bookingFillTimer) clearTimeout(bookingFillTimer);
      set({ bookingFilled: Object.keys(patch) });
      bookingFillTimer = setTimeout(() => set({ bookingFilled: [] }), FILL_HIGHLIGHT_MS);
    } else {
      set({ bookingFilled: [] });
    }
  },

  setBookingStep: (bookingStep) => set({ bookingStep }),

  resetBooking: () => set({ booking: EMPTY_BOOKING, bookingStep: "schedule", bookingFilled: [] }),

  confirmBooking: async () => {
    const { booking, activeCategory } = get();
    if (!booking.date || !booking.time) return;
    set({ bookingStep: "processing" });
    const receipt = await runBooking({
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      categoryId: activeCategory ?? "general",
      // The guest's stated reason wins; otherwise fall back to the category.
      service: booking.service.trim() || serviceLabel(activeCategory),
      date: booking.date,
      time: booking.time,
      notes: booking.notes,
    });
    set({ lastReceipt: receipt, bookingStep: "confirmation" });
  },

  openDemoFlow: (flow) => {
    if (flow === "checkout") get().resetCheckout();
    if (flow === "booking") get().resetBooking();
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

  closeDemoFlow: () => {
    set({ demoFlow: null });
    // Drop any captured contact details once the panel is dismissed.
    get().resetCheckout();
    get().resetBooking();
  },

  backToBoutique: () => {
    set({
      scene: "boutique-window",
      activeCategory: null,
      selectedProduct: null,
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
