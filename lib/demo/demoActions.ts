// Demo-safe action handler. Simulates processing latency and returns a local
// receipt. Intentionally isolated from any real provider so that swapping in a
// production integration is a one-file change.
//
// PRODUCTION INTEGRATION POINTS are marked with TODO(production). Until those
// are wired, NOTHING here performs a real payment, CRM write, email, SMS, or
// inventory change. See docs/DEMO_SAFE_RULES.md.

import type { CheckoutPayload, DemoReceipt } from "@/types/demo";
import { createReceipt } from "./demoReceipts";

/** Simulated network/processing delay so the UI can show a real-feeling state. */
function simulate(ms = 1400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runCheckout(payload: {
  name: string;
  email: string;
  phone: string;
  paymentMethod: CheckoutPayload["paymentMethod"];
  consent: boolean;
  items: { name: string; priceLabel: string; qty: number }[];
  total: string;
}): Promise<DemoReceipt> {
  await simulate();
  // TODO(production): create order + capture payment via your processor here.
  const pieces = payload.items.reduce((n, i) => n + i.qty, 0);
  const summary =
    payload.items.length === 1
      ? `${payload.items[0].name} — ${payload.total}`
      : `${pieces} pieces — ${payload.total}`;
  return createReceipt(
    "checkout",
    summary,
    "A confirmation has been sent to your email. Our team will be in touch about delivery.",
  );
}
