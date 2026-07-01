// Generates demo-safe reference numbers + receipts. These are entirely local —
// no number here corresponds to a real order or session.

import type { DemoFlowId } from "@/types/experience";
import type { DemoReceipt } from "@/types/demo";
import { DEMO_FLOWS } from "@/config/demo-flows";

// Seeded, monotonically increasing so demo references look plausible and unique
// within a session without leaking any real identifiers.
let counter = 1040;

function nextReference(prefix: string): string {
  counter += 7 + Math.floor(Math.random() * 41);
  return `${prefix}-${counter}`;
}

export function createReceipt(
  kind: DemoFlowId,
  summary: string,
  productionNote: string,
): DemoReceipt {
  const config = DEMO_FLOWS[kind];
  return {
    kind,
    reference: nextReference(config.referencePrefix),
    createdLabel: new Date().toLocaleString(),
    summary,
    productionNote,
  };
}
