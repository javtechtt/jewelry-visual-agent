// Demo-safe flow payloads + receipts.
// IMPORTANT: these describe the *frontend* journey only. No payload is ever
// sent to a real payment processor, CRM, calendar, or messaging provider.
// See docs/DEMO_SAFE_RULES.md.

import type { CategoryId } from "./category";
import type { DemoFlowId } from "./experience";

export interface ContactDetails {
  name: string;
  email: string;
  phone: string;
}

export interface CheckoutPayload extends ContactDetails {
  productId: string;
  productName: string;
  priceLabel: string;
  /** Placeholder choices only — never a real card number. */
  paymentMethod: "demo-card" | "pay-in-person" | "request-invoice" | "confirm-later";
  consent: boolean;
}

export interface BookingPayload extends ContactDetails {
  categoryId: CategoryId | "general";
  service: string;
  date: string;
  time: string;
  notes: string;
}

export interface LeadPayload extends ContactDetails {
  interest: string;
  notes: string;
  consent: boolean;
}

export interface HandoffPayload extends ContactDetails {
  topic: string;
  /** How the guest would like a human to follow up. */
  channel: "voice" | "email" | "in-boutique";
  notes: string;
}

/** A demo confirmation artifact shown after a simulated flow completes. */
export interface DemoReceipt {
  kind: DemoFlowId;
  /** e.g. DEMO-ORD-1048 / DEMO-BOOK-2381 / DEMO-LEAD-7820 / DEMO-APT-4309. */
  reference: string;
  /** Human-readable creation label (set client-side). */
  createdLabel: string;
  /** Short summary line for the confirmation screen. */
  summary: string;
  /** The next step a real business would take in production. */
  productionNote: string;
}

/** Field-level validation errors keyed by field name. */
export type ValidationErrors = Record<string, string>;
