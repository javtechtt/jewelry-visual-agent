"use client";

// A transient, unobtrusive hint shown ONLY when the guest has engaged the mic
// but live voice is unavailable (permission denied, no key, or the live session
// failed → "mock"/"error"). This surfaces an otherwise-silent failure without
// re-introducing a persistent connection badge or on-screen narration. Tapping
// it opens the text-command panel.

import { AnimatePresence, motion } from "framer-motion";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";

export default function VoiceStatusHint() {
  const status = useExperienceStore((s) => s.realtimeStatus);
  const micActive = useExperienceStore((s) => s.micActive);
  const textOpen = useExperienceStore((s) => s.textFallbackOpen);
  const setTextFallbackOpen = useExperienceStore((s) => s.setTextFallbackOpen);

  const show = micActive && !textOpen && (status === "mock" || status === "error");

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          className="voice-hint"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => setTextFallbackOpen(true)}
        >
          Can&rsquo;t reach your mic — tap to type to Aurelis
        </motion.button>
      )}
    </AnimatePresence>
  );
}
