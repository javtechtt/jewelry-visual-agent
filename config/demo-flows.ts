// Demo-safe flow configuration: which overlay opens, its copy, and the safe
// placeholder option sets. Nothing here triggers a real transaction.
// See docs/DEMO_SAFE_RULES.md.

import type { DemoFlowId } from "@/types/experience";

export interface DemoFlowConfig {
  id: DemoFlowId;
  title: string;
  /** Short demo-safe subtitle shown under the title. */
  subtitle: string;
  /** Prefix for the generated reference number, e.g. "DEMO-ORD". */
  referencePrefix: string;
  /** Microcopy reassuring the guest this is a simulation. */
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
  booking: {
    id: "booking",
    title: "Book an Appointment",
    subtitle: "Choose a date and time for your private viewing.",
    referencePrefix: "APT",
    safeNote: "",
  },
  lead: {
    id: "lead",
    title: "Stay in Touch",
    subtitle: "Leave your details for a stylist follow-up.",
    referencePrefix: "REF",
    safeNote: "",
  },
  handoff: {
    id: "handoff",
    title: "Human Concierge",
    subtitle: "We'll connect you with a person.",
    referencePrefix: "CNC",
    safeNote: "",
  },
};

/** Payment choices. The "card" option shows card fields that are local-only and
 *  never transmitted (see DemoCheckoutOverlay) — no real card is ever captured. */
export const PAYMENT_METHODS = [
  { id: "card", label: "Card" },
  { id: "boutique", label: "Pay in Boutique" },
  { id: "invoice", label: "Request Invoice" },
] as const;

/** Bookable times offered for any chosen calendar day. */
export const APPOINTMENT_TIMES = [
  "10:00",
  "11:30",
  "13:00",
  "14:30",
  "16:00",
  "17:30",
];

export const HANDOFF_CHANNELS = [
  { id: "voice", label: "Voice call" },
  { id: "email", label: "Email" },
  { id: "in-boutique", label: "In boutique" },
] as const;

export const LEAD_INTERESTS = [
  "New arrivals",
  "A specific piece",
  "Bespoke commission",
  "Gifting",
  "Private event",
];
