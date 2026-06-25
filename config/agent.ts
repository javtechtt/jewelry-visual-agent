// Aurelis — the AI concierge presence. This config seeds the orb's personality,
// the spoken greeting lines, and (critically) the system instructions handed to
// the OpenAI Realtime session created in app/api/realtime-session/route.ts.

import { CATEGORIES } from "./categories";
import { CATEGORY_OPTIONS } from "./category-options";
import { PAYMENT_METHODS } from "./demo-flows";

export const AGENT = {
  name: "Aurelis",
  /** Realtime voice id. Swap to a supported gpt-realtime-2 voice as needed. */
  voice: "alloy",
  /** Visual identity for the orb (light premium, not a dark sci-fi orb). */
  visual: {
    coreColor: "#fff7e8",
    glowColor: "#f6e4bb",
    listeningColor: "#dbeaf4",
    speakingColor: "#f7e6c8",
  },
  /** Short, minimal captions Aurelis "speaks" as it guides the experience. */
  lines: {
    greeting: "Welcome to Aurelis. Tell me what you're looking for.",
    boutique: "Choose a world, or simply say what you'd like to see.",
    enterCategory: (label: string) => `Stepping into ${label}.`,
    selectProduct: (name: string) => `A beautiful choice — the ${name}.`,
    checkout: "I've prepared your private checkout.",
    booking: "Let's arrange a private appointment. These are demo time slots.",
    lead: "I'll note your details so a stylist can follow up.",
    handoff: "Connecting you with a human concierge.",
    back: "Returning to the boutique window.",
    reset: "Starting over. Welcome back.",
    unknown: "I didn't quite catch that — try a category, or open the text panel.",
  },
} as const;

/** Catalog injected into the prompt so the model knows the EXACT piece names to
 *  pass to select_product (the names are otherwise client-side only). */
const PRODUCT_CATALOG = CATEGORIES.map(
  (c) => `- ${c.label}: ${CATEGORY_OPTIONS[c.id].map((o) => `${o.name} (${o.priceLabel})`).join(", ")}`,
).join("\n");

/**
 * System instructions for the Realtime session. Kept here so the server route
 * and any future client tooling share one source of truth.
 */
export const AGENT_INSTRUCTIONS = `You are Aurelis, the live voice concierge of a modern luxury boutique. You speak
the way a poised, attentive concierge does: warm, natural, and unhurried, with a
touch of genuine delight. Vary how you phrase things and never sound scripted or
robotic. Keep replies short — usually one easy sentence — and don't lecture, list
more than asked, or narrate what the screen is doing.

You help guests explore these categories: Watches, Jewelry, Bags, Fragrances,
and Accessories. The pieces, by category (use these EXACT names with
select_product / add_to_cart):
${PRODUCT_CATALOG}

You are a real concierge. Never call anything a demo, simulation, or test, and
never mention that payment isn't taken.

Guests gather pieces into a BAG, then check out. Use add_to_cart to add a piece
(by exact name, or the one in focus), remove_from_cart to take one out, and
start_checkout to begin checkout for the whole bag.

Never announce or describe a screen — just move the guest through it gracefully.

CHECKOUT has three screens — details, payment, confirmation — and you guide the
whole way:
- Details: ask for the name, email, and phone for the order. The guest may give
  them all at once or one at a time. The MOMENT you hear any of them, call
  set_checkout_details to write it into the form — pass whatever you have so far.
  Do NOT read values back or ask them to confirm each field as you fill it. Once
  all three are in, warmly ask if everything looks right and whether they'd like
  to continue to payment; only when they agree, call go_to_payment.
- Payment: ask how they'd like to pay and call set_payment_method when they
  choose. When they're ready, call place_order.
- Confirmation: congratulate them simply and warmly, and invite them to keep
  exploring.

Always call the matching tool when the guest asks for something — don't just
describe it. Tools: show_category, select_product, add_to_cart, remove_from_cart,
start_checkout, set_checkout_details, set_payment_method, go_to_payment,
place_order, book_appointment, capture_lead, connect_human, back_to_boutique,
start_over.`;

/**
 * Function tools the Realtime model can call to drive the boutique. Names match
 * AGENT_INSTRUCTIONS; the handlers live in components/voice/VoiceController.tsx.
 * The category enum is derived from CATEGORIES so it can never drift.
 */
export const AGENT_TOOLS = [
  {
    type: "function",
    name: "show_category",
    description: "Open one of the boutique's product category worlds.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: CATEGORIES.map((c) => c.id),
          description: "Which category world to open.",
        },
      },
      required: ["category"],
    },
  },
  {
    type: "function",
    name: "select_product",
    description: "Focus/select a specific piece by name (any category).",
    parameters: {
      type: "object",
      properties: { name: { type: "string", description: "The piece name." } },
      required: ["name"],
    },
  },
  {
    type: "function",
    name: "add_to_cart",
    description:
      "Add a piece to the guest's bag. Pass the exact piece name, or omit to add the piece currently in focus.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Piece name (optional; defaults to the focused piece)." },
      },
    },
  },
  {
    type: "function",
    name: "remove_from_cart",
    description: "Remove a piece from the guest's bag, by name.",
    parameters: {
      type: "object",
      properties: { name: { type: "string", description: "Piece name to remove." } },
      required: ["name"],
    },
  },
  {
    type: "function",
    name: "start_checkout",
    description: "Open checkout for everything in the bag (starts on the details screen).",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "set_checkout_details",
    description:
      "Fill the checkout form with the guest's contact details, live as they speak. Pass any subset of name, email, phone — call again as you learn more. Do NOT confirm a field before filling it.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Full name for the order." },
        email: { type: "string", description: "Email for the confirmation." },
        phone: { type: "string", description: "Contact phone number." },
      },
    },
  },
  {
    type: "function",
    name: "set_payment_method",
    description: "Choose how the guest will pay on the payment screen.",
    parameters: {
      type: "object",
      properties: {
        method: {
          type: "string",
          enum: PAYMENT_METHODS.map((m) => m.id),
          description: "The selected payment method.",
        },
      },
      required: ["method"],
    },
  },
  {
    type: "function",
    name: "go_to_payment",
    description:
      "Advance from the details screen to the payment screen. Only after the guest confirms their details look right.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "place_order",
    description: "Place the order from the payment screen and show the confirmation.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "book_appointment",
    description: "Open the demo private-appointment booking flow.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "capture_lead",
    description: "Open the demo form to capture the guest's contact details.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "connect_human",
    description: "Open the demo human-concierge handoff.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "back_to_boutique",
    description: "Return to the main boutique window.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "start_over",
    description: "Reset the whole experience to the beginning.",
    parameters: { type: "object", properties: {} },
  },
];
