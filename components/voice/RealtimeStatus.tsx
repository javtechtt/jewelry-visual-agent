"use client";

// A discreet status pill showing the voice pipeline state + target model. In
// "mock" mode it signals the graceful fallback without alarming language.

import { useExperienceStore } from "@/lib/stores/useExperienceStore";

const MODEL = process.env.NEXT_PUBLIC_REALTIME_MODEL?.trim() || "gpt-realtime-2";

const LABELS: Record<string, string> = {
  idle: "Voice ready",
  connecting: "Connecting…",
  connected: "Live · OpenAI Realtime",
  mock: "Demo voice (fallback)",
  error: "Voice unavailable",
};

export default function RealtimeStatus() {
  const status = useExperienceStore((s) => s.realtimeStatus);

  return (
    <div className={`status-pill status-pill--${status}`} title={`Target model: ${MODEL}`}>
      <span className="status-pill__dot" aria-hidden="true" />
      <span className="status-pill__label">{LABELS[status] ?? "Voice"}</span>
    </div>
  );
}
