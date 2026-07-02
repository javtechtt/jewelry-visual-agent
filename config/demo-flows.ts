// Demo-safe flow configuration: the checkout overlay's copy and the safe
// payment options. Nothing here triggers a real transaction.
// See docs/DEMO_SAFE_RULES.md.

import type { DemoFlowId } from "@/types/experience";

export interface DemoFlowConfig {
  id: DemoFlowId;
  title: string;
  /** Short subtitle shown under the title. */
  subtitle: string;
  /** Prefix for the generated reference number, e.g. "ORD". */
  referencePrefix: string;
  /** Optional reassuring microcopy (unused for the real-feeling checkout). */
  safeNote: string;
}

export const DEMO_FLOWS: Record<DemoFlowId, DemoFlowConfig> = {
  checkout: {
    id: "checkout",
    title: "Checkout",
    subtitle: "Complete your order in a few graceful steps.",
    referencePrefix: "ORD",
    safeNote: "",
  },
};

/** Payment choices. The "card" option shows card fields that are local-only and
 *  never transmitted (see CheckoutFlow) — no real card is ever captured. */
export const PAYMENT_METHODS = [
  { id: "card", label: "Card" },
  { id: "boutique", label: "Pay in Boutique" },
  { id: "invoice", label: "Request Invoice" },
] as const;
