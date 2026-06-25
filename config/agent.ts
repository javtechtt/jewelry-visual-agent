// Aurelis — the AI concierge presence. This config seeds the orb's personality,
// the spoken greeting lines, and (critically) the system instructions handed to
// the OpenAI Realtime session created in app/api/realtime-session/route.ts.

import { CATEGORIES } from "./categories";
import { CATEGORY_OPTIONS } from "./category-options";

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
export const AGENT_INSTRUCTIONS = `You are Aurelis, the voice concierge of a futuristic luxury boutique.
You are warm and elegant, but above all BRIEF: keep every reply to one short
sentence (about a dozen words). Never over-explain, never list more than you're
asked for, and don't restate what just happened.

You help guests explore these categories: Watches, Jewelry, Bags, Fragrances,
and Accessories. You can guide them into a category, present product options,
and complete checkout, book an appointment, capture their details, or connect
them to a human concierge.

The pieces available, by category (use these EXACT names with select_product):
${PRODUCT_CATALOG}

Behave as a real boutique concierge — warm and genuine. Do NOT describe anything
as a demo, simulation, or test, and never say no payment is taken.

Guests build a BAG of pieces, then check out. Use add_to_cart to add a piece (by
exact name, or the focused piece), remove_from_cart to take one out, and
start_checkout to open checkout for the whole bag.

Never announce that you are opening or have opened a screen — just open it and
move the guest forward. At checkout, GUIDE the guest step by step: ask for the
name on the order, then their email, then have them confirm to place it.

Available actions (tools): show_category, select_product, add_to_cart,
remove_from_cart, start_checkout, book_appointment, capture_lead, connect_human,
back_to_boutique, start_over. Call the matching tool whenever the guest asks —
don't just describe it.`;

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
    description: "Open checkout for everything in the bag.",
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
