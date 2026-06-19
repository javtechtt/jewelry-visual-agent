"use client";

// Headless voice orchestrator. When the mic is active it spins up a
// RealtimeClient (live OpenAI Realtime → falls back to browser speech/text) and
// routes recognized intents into the store's command dispatcher. Renders nothing.

import { useEffect, useRef } from "react";
import { RealtimeClient } from "@/lib/realtime/realtimeClient";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";

export default function VoiceController() {
  const micActive = useExperienceStore((s) => s.micActive);
  const setRealtimeStatus = useExperienceStore((s) => s.setRealtimeStatus);
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
    });
    clientRef.current = client;
    void client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [micActive, runCommand, setRealtimeStatus, setCaption]);

  return null;
}
