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
    title: "Private Checkout",
    subtitle: "Review and complete your order.",
    referencePrefix: "ORD",
    safeNote: "",
  },
  booking: {
    id: "booking",
    title: "Book an Appointment",
    subtitle: "Choose a demo time for your private viewing.",
    referencePrefix: "DEMO-APT",
    safeNote: "This prototype simulates the booking flow. No real appointment is reserved.",
  },
  lead: {
    id: "lead",
    title: "Stay in Touch",
    subtitle: "Leave your details for a stylist follow-up.",
    referencePrefix: "DEMO-LEAD",
    safeNote: "In production this would notify the boutique's CRM. Nothing is sent in this demo.",
  },
  handoff: {
    id: "handoff",
    title: "Human Concierge",
    subtitle: "We'll connect you with a person.",
    referencePrefix: "DEMO-CONC",
    safeNote: "This is a demo. In production a concierge would receive your request.",
  },
};

/** Placeholder payment choices — never a real card number. */
export const PAYMENT_METHODS = [
  { id: "demo-card", label: "Card" },
  { id: "pay-in-person", label: "Pay in Boutique" },
  { id: "request-invoice", label: "Request Invoice" },
  { id: "confirm-later", label: "Confirm Later" },
] as const;

/** Demo appointment slots. Not backed by any real calendar/availability. */
export const DEMO_TIME_SLOTS = [
  "Tomorrow · 11:00",
  "Tomorrow · 15:30",
  "Saturday · 10:00",
  "Saturday · 14:00",
  "Next week · By arrangement",
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
