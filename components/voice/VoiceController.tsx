"use client";

// Headless voice orchestrator. When the mic is active it spins up a
// RealtimeClient (live OpenAI Realtime → falls back to browser speech/text) and
// routes the model's tool calls + recognized intents into the store. The live
// path drives the boutique through tool calls; the fallback path uses intents.
// Renders nothing.

import { useEffect, useRef } from "react";
import { RealtimeClient } from "@/lib/realtime/realtimeClient";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { getCategoryOptions } from "@/config/category-options";
import { CATEGORIES } from "@/config/categories";
import { PAYMENT_METHODS } from "@/config/demo-flows";
import { isEmail } from "@/lib/demo/demoValidation";
import type { CategoryId, CategoryOption } from "@/types/category";
import type { SelectedProduct } from "@/types/experience";
import type { CheckoutForm, PaymentMethodId } from "@/types/demo";

export default function VoiceController() {
  const micActive = useExperienceStore((s) => s.micActive);
  const setRealtimeStatus = useExperienceStore((s) => s.setRealtimeStatus);
  const setAgentState = useExperienceStore((s) => s.setAgentState);
  const runCommand = useExperienceStore((s) => s.runCommand);
  const setCaption = useExperienceStore((s) => s.setCaption);
  const clientRef = useRef<RealtimeClient | null>(null);

  useEffect(() => {
    if (!micActive) {
      clientRef.current?.disconnect();
      clientRef.current = null;
      setRealtimeStatus("idle");
      return;
    }

    const client = new RealtimeClient({
      onStatus: (status) => setRealtimeStatus(status),
      onTranscript: (text) => setCaption(`“${text}”`),
      onIntent: (intent) => runCommand(intent),
      onAgentState: (state) => setAgentState(state),
      onToolCall: (name, args) => runToolCall(name, args),
    });
    clientRef.current = client;
    void client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [micActive, runCommand, setRealtimeStatus, setCaption, setAgentState]);

  return null;
}

/**
 * Execute a Realtime tool call against the store and return a short, natural
 * result string the model can read back to the guest. Uses store.getState() so
 * it never needs to be a hook.
 */
/** Match a spoken name to an option: substring first, then best word overlap. */
function matchOption(options: CategoryOption[], wanted: string): CategoryOption | undefined {
  const direct = options.find(
    (o) => o.name.toLowerCase().includes(wanted) || wanted.includes(o.name.toLowerCase()),
  );
  if (direct) return direct;
  const words = wanted.split(/\s+/).filter((w) => w.length > 2);
  let best: CategoryOption | undefined;
  let bestScore = 0;
  for (const o of options) {
    const name = o.name.toLowerCase();
    const score = words.filter((w) => name.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = o;
    }
  }
  return bestScore > 0 ? best : undefined;
}

function runToolCall(name: string, args: Record<string, unknown>): string {
  const store = useExperienceStore.getState();

  switch (name) {
    case "show_category": {
      const category = String(args.category ?? "") as CategoryId;
      store.runCommand({ command: "show-category", category });
      return `(Showing ${category}. Invite the guest to look, briefly.)`;
    }
    case "select_product": {
      const wanted = String(args.name ?? "").toLowerCase().trim();
      if (!wanted) return "Which piece would you like to see?";
      // Search the active category first, then EVERY category — so the piece is
      // found even before its category is open, or if the category just changed.
      const ids = CATEGORIES.map((c) => c.id);
      const order = store.activeCategory
        ? [store.activeCategory, ...ids.filter((id) => id !== store.activeCategory)]
        : ids;
      for (const catId of order) {
        const opt = matchOption(getCategoryOptions(catId), wanted);
        if (opt) {
          if (store.activeCategory !== catId) {
            store.runCommand({ command: "show-category", category: catId });
          }
          store.selectProduct({
            id: opt.id,
            categoryId: opt.categoryId,
            name: opt.name,
            priceLabel: opt.priceLabel,
          });
          return `Selected the ${opt.name}.`;
        }
      }
      return "I couldn't find that piece.";
    }
    case "add_to_cart": {
      const wanted = String(args.name ?? "").toLowerCase().trim();
      let piece: SelectedProduct | undefined;
      if (wanted) {
        for (const catId of CATEGORIES.map((c) => c.id)) {
          const opt = matchOption(getCategoryOptions(catId), wanted);
          if (opt) {
            piece = { id: opt.id, categoryId: opt.categoryId, name: opt.name, priceLabel: opt.priceLabel };
            break;
          }
        }
      } else if (store.selectedProduct) {
        piece = store.selectedProduct;
      }
      if (!piece) return "(No piece matched — ask the guest which piece to add.)";
      store.addToCart(piece);
      const count = useExperienceStore.getState().cart.reduce((n, i) => n + i.qty, 0);
      return `(Added the ${piece.name} to the bag — ${count} item${count === 1 ? "" : "s"}. Acknowledge briefly.)`;
    }
    case "remove_from_cart": {
      const wanted = String(args.name ?? "").toLowerCase().trim();
      const item = store.cart.find(
        (c) => c.name.toLowerCase().includes(wanted) || wanted.includes(c.name.toLowerCase()),
      );
      if (!item) return "(That piece isn't in the bag.)";
      store.removeFromCart(item.id);
      return `(Removed the ${item.name} from the bag.)`;
    }
    case "start_checkout": {
      // The bag is the source of truth; if it's empty, fold in the focused piece.
      if (store.cart.length === 0) {
        if (store.selectedProduct) store.addToCart(store.selectedProduct);
        else return "(The bag is empty — ask the guest to choose a piece first.)";
      }
      store.runCommand({ command: "start-checkout" });
      return "(Checkout is open on the details screen. Don't announce it — ask for the name, email, and phone for the order.)";
    }
    case "set_checkout_details": {
      // Fill whatever the guest just gave us straight into the form.
      const patch: Partial<CheckoutForm> = {};
      if (args.name != null && String(args.name).trim()) patch.name = String(args.name).trim();
      if (args.email != null && String(args.email).trim()) patch.email = String(args.email).trim();
      if (args.phone != null && String(args.phone).trim()) patch.phone = String(args.phone).trim();
      if (Object.keys(patch).length === 0) {
        return "(No details heard — ask the guest for the name, email, and phone.)";
      }
      // Make sure checkout is actually open before writing into it.
      if (store.demoFlow !== "checkout") {
        if (store.cart.length === 0) {
          if (store.selectedProduct) store.addToCart(store.selectedProduct);
          else return "(The bag is empty — add a piece before taking checkout details.)";
        }
        store.runCommand({ command: "start-checkout" });
      }
      store.updateCheckout(patch, true);
      const c = useExperienceStore.getState().checkout;
      const missing: string[] = [];
      if (!c.name.trim()) missing.push("name");
      if (!isEmail(c.email)) missing.push("email");
      if (!c.phone.trim()) missing.push("phone");
      if (missing.length > 0) {
        return `(Filled. Still need their ${missing.join(" and ")} — ask for it; don't read back what you have.)`;
      }
      return "(All details are in. Ask if everything looks right and whether they'd like to continue to payment.)";
    }
    case "set_payment_method": {
      const method = String(args.method ?? "");
      if (!PAYMENT_METHODS.some((m) => m.id === method)) return "(That payment option isn't available.)";
      store.updateCheckout({ paymentMethod: method as PaymentMethodId }, true);
      if (useExperienceStore.getState().checkoutStep === "details") store.setCheckoutStep("payment");
      return "(Payment method set. When the guest is ready, place the order.)";
    }
    case "go_to_payment": {
      const c = useExperienceStore.getState().checkout;
      const missing: string[] = [];
      if (!c.name.trim()) missing.push("their name");
      if (!isEmail(c.email)) missing.push("a valid email");
      if (!c.phone.trim()) missing.push("a phone number");
      if (missing.length > 0) {
        return `(Can't continue yet — still need ${missing.join(" and ")}. Ask for it.)`;
      }
      if (store.demoFlow !== "checkout") store.runCommand({ command: "start-checkout" });
      store.setCheckoutStep("payment");
      return "(On the payment screen now. Ask the guest how they'd like to pay.)";
    }
    case "place_order": {
      const st = useExperienceStore.getState();
      if (st.cart.length === 0) return "(The bag is empty — there's nothing to order.)";
      if (st.checkoutStep === "details") st.setCheckoutStep("payment");
      void st.placeOrder();
      return "(Placing the order now — reassure the guest warmly while it completes.)";
    }
    case "book_appointment":
      store.runCommand({ command: "book-appointment" });
      return "(Booking is open. Don't announce it — guide the guest to pick a time.)";
    case "capture_lead":
      store.runCommand({ command: "request-info" });
      return "(The details form is open. Ask for the guest's name and email.)";
    case "connect_human":
      store.runCommand({ command: "connect-human" });
      return "(Connecting a concierge. Reassure the guest a person will be with them shortly.)";
    case "back_to_boutique":
      store.runCommand({ command: "back-to-boutique" });
      return "Back to the boutique window.";
    case "start_over":
      store.runCommand({ command: "start-over" });
      return "Starting over.";
    default:
      return "That action isn't available.";
  }
}
