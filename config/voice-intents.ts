// Voice + text intent table. Recognized speech (Realtime/Web Speech) or typed
// fallback text is matched against these phrases to produce a CommandId. The
// live Realtime path drives the boutique via tool calls; this table backs the
// browser-speech / text fallback.

import type { MatchedIntent, VoiceIntent } from "@/types/voice";
import { PRODUCTS } from "./products";

// One "select <piece>" intent per product, derived from the collection.
const productIntents: VoiceIntent[] = PRODUCTS.map((product) => {
  const name = product.name.toLowerCase();
  return {
    id: "select-product",
    productId: product.id,
    description: `Focus the ${product.name}`,
    phrases: [name, `the ${name}`, `show ${name}`, `show me ${name}`],
  };
});

export const VOICE_INTENTS: VoiceIntent[] = [
  ...productIntents,
  {
    id: "start-checkout",
    description: "Open checkout for the bag",
    phrases: ["start checkout", "check out", "checkout", "buy this", "buy it", "purchase", "pay"],
  },
  {
    id: "start-over",
    description: "Reset the whole experience",
    phrases: ["start over", "reset", "begin again", "start again"],
  },
];

/**
 * Match recognized/typed text against the intent table. Longer phrases are
 * tried first so a full piece name wins over a shorter, more generic phrase.
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
        productId: intent.productId,
        transcript: rawText,
      };
    }
  }
  return null;
}

/** Compact list of example commands for the text-fallback placeholder/help. */
export const EXAMPLE_COMMANDS: string[] = [
  PRODUCTS[0].name,
  PRODUCTS[2].name,
  "checkout",
  "start over",
];
