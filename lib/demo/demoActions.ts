// Demo-safe action handlers. Each simulates processing latency and returns a
// local receipt. They are intentionally isolated from any real provider so that
// swapping in a production integration is a one-file change.
//
// PRODUCTION INTEGRATION POINTS are marked with TODO(production). Until those
// are wired, NOTHING here performs a real payment, booking, CRM write, email,
// SMS, calendar event, or inventory change. See docs/DEMO_SAFE_RULES.md.

import type {
  BookingPayload,
  CheckoutPayload,
  DemoReceipt,
  HandoffPayload,
  LeadPayload,
} from "@/types/demo";
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

export async function runBooking(payload: BookingPayload): Promise<DemoReceipt> {
  await simulate();
  // TODO(production): create a calendar event / appointment request here.
  return createReceipt(
    "booking",
    `${payload.service} · ${payload.date}${payload.time ? ` · ${payload.time}` : ""}`,
    "Your appointment is reserved. We've sent the details to your email and our team will confirm shortly.",
  );
}

export async function submitLead(payload: LeadPayload): Promise<DemoReceipt> {
  await simulate(1100);
  // TODO(production): push to CRM / notify the boutique here.
  return createReceipt(
    "lead",
    `${payload.name} · ${payload.interest}`,
    "Thank you — a stylist will be in touch with you very soon.",
  );
}

export async function requestHandoff(payload: HandoffPayload): Promise<DemoReceipt> {
  await simulate(1100);
  // TODO(production): create a live concierge handoff / ticket here.
  return createReceipt(
    "handoff",
    `${payload.topic} · via ${payload.channel}`,
    "You're in the queue — a concierge will be with you in just a moment.",
  );
}
