"use client";

// Minimal caption line above the mic: Aurelis' short spoken lines, or the text
// it just heard. Kept brief per the luxury copy rules — no paragraphs.

import { AnimatePresence, motion } from "framer-motion";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";

export default function VoiceCaption() {
  const caption = useExperienceStore((s) => s.caption);
  const agentState = useExperienceStore((s) => s.agentState);

  return (
    <div className="caption-dock" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.p
          key={caption}
          className={`caption caption--${agentState}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {caption}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
