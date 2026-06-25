"use client";

// Headless voice orchestrator. When the mic is active it spins up a
// RealtimeClient (live OpenAI Realtime → falls back to browser speech/text) and
// routes the model's tool calls + recognized intents into the store. The live
// path drives the boutique through tool calls; the fallback path uses intents.
// Renders nothing.

import { useEffect, useRef } from "react";
import { RealtimeClient } from "@/lib/realtime/realtimeClient";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { getCategoryOptions } from "@/config/category-options";
import type { CategoryId } from "@/types/category";

export default function VoiceController() {
  const micActive = useExperienceStore((s) => s.micActive);
  const setRealtimeStatus = useExperienceStore((s) => s.setRealtimeStatus);
  const setAgentState = useExperienceStore((s) => s.setAgentState);
  const runCommand = useExperienceStore((s) => s.runCommand);
  const setCaption = useExperienceStore((s) => s.setCaption);
  const clientRef = useRef<RealtimeClient | null>(null);

  useEffect(() => {
    if (!micActive) {
      clientRef.current?.disconnect();
      clientRef.current = null;
      setRealtimeStatus("idle");
      return;
    }

    const client = new RealtimeClient({
      onStatus: (status) => setRealtimeStatus(status),
      onTranscript: (text) => setCaption(`“${text}”`),
      onIntent: (intent) => runCommand(intent),
      onAgentState: (state) => setAgentState(state),
      onToolCall: (name, args) => runToolCall(name, args),
    });
    clientRef.current = client;
    void client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [micActive, runCommand, setRealtimeStatus, setCaption, setAgentState]);

  return null;
}

/**
 * Execute a Realtime tool call against the store and return a short, natural
 * result string the model can read back to the guest. Uses store.getState() so
 * it never needs to be a hook.
 */
function runToolCall(name: string, args: Record<string, unknown>): string {
  const store = useExperienceStore.getState();

  switch (name) {
    case "show_category": {
      const category = String(args.category ?? "") as CategoryId;
      store.runCommand({ command: "show-category", category });
      return `Opened the ${category} world.`;
    }
    case "select_product": {
      const cat = store.activeCategory;
      const wanted = String(args.name ?? "").toLowerCase().trim();
      if (cat && wanted) {
        const opt = getCategoryOptions(cat).find(
          (o) =>
            o.name.toLowerCase().includes(wanted) || wanted.includes(o.name.toLowerCase()),
        );
        if (opt) {
          store.selectProduct({
            id: opt.id,
            categoryId: opt.categoryId,
            name: opt.name,
            priceLabel: opt.priceLabel,
          });
          return `Selected the ${opt.name}.`;
        }
      }
      return "I couldn't find that piece in this collection.";
    }
    case "start_checkout":
      store.runCommand({ command: "start-checkout" });
      return "Opened the demo checkout.";
    case "book_appointment":
      store.runCommand({ command: "book-appointment" });
      return "Opened the demo appointment booking.";
    case "capture_lead":
      store.runCommand({ command: "request-info" });
      return "Opened the details form.";
    case "connect_human":
      store.runCommand({ command: "connect-human" });
      return "Opening a concierge handoff.";
    case "back_to_boutique":
      store.runCommand({ command: "back-to-boutique" });
      return "Back to the boutique window.";
    case "start_over":
      store.runCommand({ command: "start-over" });
      return "Starting over.";
    default:
      return "That action isn't available.";
  }
}
