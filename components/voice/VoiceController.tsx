"use client";

// Headless voice orchestrator. When the mic is active it spins up a
// RealtimeClient (live OpenAI Realtime → falls back to browser speech/text) and
// routes the model's tool calls + recognized intents into the store. The live
// path drives the boutique through tool calls; the fallback path uses intents.
// Renders nothing.

import { useEffect, useRef } from "react";
import { RealtimeClient } from "@/lib/realtime/realtimeClient";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { PRODUCTS } from "@/config/products";
import { PAYMENT_METHODS } from "@/config/demo-flows";
import { isEmail } from "@/lib/demo/demoValidation";
import { formatCardNumber, formatCvc, formatExpiry } from "@/lib/demo/cardFormat";
import type { Product } from "@/types/product";
import type { SelectedProduct } from "@/types/experience";
import type { CardDetails, CheckoutForm, PaymentMethodId } from "@/types/demo";

export default function VoiceController() {
  const micActive = useExperienceStore((s) => s.micActive);
  const setRealtimeStatus = useExperienceStore((s) => s.setRealtimeStatus);
  const setAgentState = useExperienceStore((s) => s.setAgentState);
  const runCommand = useExperienceStore((s) => s.runCommand);
  const setCaption = useExperienceStore((s) => s.setCaption);
  const clientRef = useRef<RealtimeClient | null>(null);
  // Per-utterance dedup so each named piece glows once, not on every delta.
  const namedRef = useRef<Set<string>>(new Set());
  const lastLenRef = useRef(0);

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
      onAssistantTranscript: (text) => {
        // Glow each piece the moment Aurelis names it while suggesting. A new
        // utterance restarts the transcript from empty → reset the dedup set.
        if (text.length < lastLenRef.current) namedRef.current.clear();
        lastLenRef.current = text.length;
        const lower = text.toLowerCase();
        const { highlightProduct } = useExperienceStore.getState();
        for (const p of PRODUCTS) {
          if (!namedRef.current.has(p.id) && lower.includes(p.name.toLowerCase())) {
            namedRef.current.add(p.id);
            highlightProduct(p.id);
          }
        }
      },
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

/** Match a spoken name to a piece: substring first, then best word overlap. */
function matchProduct(wanted: string): Product | undefined {
  const direct = PRODUCTS.find(
    (p) => p.name.toLowerCase().includes(wanted) || wanted.includes(p.name.toLowerCase()),
  );
  if (direct) return direct;
  const words = wanted.split(/\s+/).filter((w) => w.length > 2);
  let best: Product | undefined;
  let bestScore = 0;
  for (const p of PRODUCTS) {
    const name = p.name.toLowerCase();
    const score = words.filter((w) => name.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return bestScore > 0 ? best : undefined;
}

/**
 * Execute a Realtime tool call against the store and return a short, natural
 * result string the model can read back to the guest. Uses store.getState() so
 * it never needs to be a hook.
 */
function runToolCall(name: string, args: Record<string, unknown>): string {
  const store = useExperienceStore.getState();

  switch (name) {
    case "select_product": {
      const wanted = String(args.name ?? "").toLowerCase().trim();
      if (!wanted) return "Which piece would you like to see?";
      const p = matchProduct(wanted);
      if (!p) return "I couldn't find that piece.";
      store.selectProduct({ id: p.id, name: p.name, priceLabel: p.priceLabel });
      return `Selected the ${p.name}.`;
    }
    case "add_to_cart": {
      const wanted = String(args.name ?? "").toLowerCase().trim();
      let piece: SelectedProduct | undefined;
      if (wanted) {
        const p = matchProduct(wanted);
        if (p) piece = { id: p.id, name: p.name, priceLabel: p.priceLabel };
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
      // Guard the empty string — `"".includes("")` is true, so a blank name would
      // otherwise silently remove the first bag item the guest never named.
      if (!wanted) return "(Which piece should I take out of the bag?)";
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
      // Only advance to payment once the contact details are complete — the same
      // gate go_to_payment + the "Continue to payment" button use. Otherwise a
      // guest who names a method early could reach Pay with a blank order.
      const c = useExperienceStore.getState().checkout;
      const detailsComplete = c.name.trim() && isEmail(c.email) && c.phone.trim();
      if (useExperienceStore.getState().checkoutStep === "details") {
        if (detailsComplete) store.setCheckoutStep("payment");
        else
          return "(Payment method noted. Still need the name, a valid email, and phone before payment — ask for whatever's missing.)";
      }
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
    case "set_payment_details": {
      if (store.demoFlow !== "checkout") {
        return "(Checkout isn't open yet — take the order details first.)";
      }
      const patch: Partial<CardDetails> = {};
      if (args.cardNumber != null && String(args.cardNumber).trim()) {
        patch.number = formatCardNumber(String(args.cardNumber));
      }
      if (args.expiry != null && String(args.expiry).trim()) patch.exp = formatExpiry(String(args.expiry));
      if (args.cvc != null && String(args.cvc).trim()) patch.cvc = formatCvc(String(args.cvc));
      if (Object.keys(patch).length === 0) {
        return "(No card details heard — ask for the card number, expiry, and security code.)";
      }
      // Make sure we're on the payment screen with the card method selected.
      store.updateCheckout({ paymentMethod: "card" });
      if (useExperienceStore.getState().checkoutStep !== "payment") store.setCheckoutStep("payment");
      store.updateCard(patch, true);
      return "(Card details filled. When everything's in, confirm with the guest before placing the order.)";
    }
    case "place_order": {
      const st = useExperienceStore.getState();
      if (st.cart.length === 0) return "(The bag is empty — there's nothing to order.)";
      const c = st.checkout;
      if (!c.name.trim() || !isEmail(c.email) || !c.phone.trim()) {
        return "(Can't place the order yet — still need the name, a valid email, and phone. Ask for what's missing.)";
      }
      if (st.checkoutStep === "details") st.setCheckoutStep("payment");
      void st.placeOrder();
      return "(Placing the order now — reassure the guest warmly while it completes.)";
    }
    case "return_to_boutique":
      // Closes checkout → CheckoutNavigator routes home. Never touches the mic,
      // so the voice session stays live (only the mic button stops it).
      store.closeDemoFlow();
      return "(Back at the boutique — keep chatting warmly; don't announce the move.)";
    case "start_over":
      store.runCommand({ command: "start-over" });
      return "Starting over.";
    default:
      return "That action isn't available.";
  }
}
