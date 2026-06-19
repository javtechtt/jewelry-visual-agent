// Voice + text intent table. Recognized speech (Realtime/Web Speech) or typed
// fallback text is matched against these phrases to produce a CommandId.

import type { CategoryId } from "@/types/category";
import type { MatchedIntent, VoiceIntent } from "@/types/voice";
import { CATEGORIES } from "./categories";

// One "show <category>" intent per category, derived from the category config.
const categoryIntents: VoiceIntent[] = CATEGORIES.map((category) => ({
  id: "show-category",
  category: category.id,
  description: `Open the ${category.label} world`,
  phrases: [
    `show ${category.label.toLowerCase()}`,
    `show me ${category.label.toLowerCase()}`,
    `open ${category.label.toLowerCase()}`,
    `${category.label.toLowerCase()}`,
  ],
}));

export const VOICE_INTENTS: VoiceIntent[] = [
  ...categoryIntents,
  {
    id: "book-appointment",
    demoFlow: "booking",
    description: "Open the demo appointment booking flow",
    phrases: ["book appointment", "book an appointment", "make an appointment", "schedule a visit"],
  },
  {
    id: "start-checkout",
    demoFlow: "checkout",
    description: "Open the demo checkout flow",
    phrases: ["start checkout", "check out", "checkout", "buy this", "purchase"],
  },
  {
    id: "connect-human",
    demoFlow: "handoff",
    description: "Request a human concierge handoff",
    phrases: ["connect me to a human", "talk to a person", "human concierge", "speak to someone"],
  },
  {
    id: "request-info",
    demoFlow: "lead",
    description: "Open the lead capture flow",
    phrases: ["leave my details", "contact me", "request information", "stay in touch"],
  },
  {
    id: "back-to-boutique",
    description: "Return to the Boutique Window",
    phrases: ["back to boutique", "back", "go back", "boutique window"],
  },
  {
    id: "start-over",
    description: "Reset the whole experience",
    phrases: ["start over", "reset", "begin again", "start again"],
  },
];

/**
 * Match recognized/typed text against the intent table. Longer phrases are
 * tried first so "back to boutique" wins over the bare "back".
 */
export function matchIntent(rawText: string): MatchedIntent | null {
  const text = rawText.trim().toLowerCase();
  if (!text) return null;

  const candidates = VOICE_INTENTS.flatMap((intent) =>
    intent.phrases.map((phrase) => ({ intent, phrase })),
  ).sort((a, b) => b.phrase.length - a.phrase.length);

  for (const { intent, phrase } of candidates) {
    if (text === phrase || text.includes(phrase)) {
      return {
        command: intent.id,
        category: intent.category,
        demoFlow: intent.demoFlow,
        transcript: rawText,
      };
    }
  }
  return null;
}

/** Compact list of example commands for the text-fallback placeholder/help. */
export const EXAMPLE_COMMANDS: string[] = [
  "show watches",
  "show jewelry",
  "book appointment",
  "start checkout",
  "connect me to a human",
  "back to boutique",
];

export const CATEGORY_IDS: CategoryId[] = CATEGORIES.map((c) => c.id);
