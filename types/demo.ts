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

/** A piece in the guest's bag. The store owns the cart; the agent mutates it
 *  only through tools (add_to_cart / remove_from_cart). */
export interface CartItem {
  id: string;
  categoryId: CategoryId;
  name: string;
  priceLabel: string;
  qty: number;
}

/** How the guest chooses to pay. (No real card number is ever transmitted.) */
export type PaymentMethodId = "card" | "boutique" | "invoice";

export interface CheckoutPayload extends ContactDetails {
  productId: string;
  productName: string;
  priceLabel: string;
  paymentMethod: PaymentMethodId;
  consent: boolean;
}

/** The three screens of the checkout journey (+ the transient processing state). */
export type CheckoutStep = "details" | "payment" | "processing" | "confirmation";

/** Live checkout form state. Lives in the store so the agent can fill it in
 *  real time via the set_checkout_details / set_payment_method tools. */
export interface CheckoutForm {
  name: string;
  email: string;
  phone: string;
  paymentMethod: PaymentMethodId;
  consent: boolean;
}

/** Card entry on the payment screen. Held in the store so the agent can fill it
 *  live, but NEVER included in any receipt or sent anywhere — it is discarded
 *  when checkout resets. */
export interface CardDetails {
  number: string;
  exp: string;
  cvc: string;
}

/** The booking journey screens (+ the transient processing state). */
export type BookingStep = "schedule" | "details" | "processing" | "confirmation";

/** Live appointment form. Lives in the store so the agent can fill the date,
 *  time, and contact details in real time. `date` is an ISO yyyy-mm-dd string. */
export interface BookingForm {
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
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
