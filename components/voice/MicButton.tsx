"use client";

// The primary, voice-first control: a premium mic orb pinned bottom-center. Its
// glow reflects Aurelis' agent state so the interface feels voice-led.

import { motion, useReducedMotion } from "framer-motion";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";

export default function MicButton() {
  const micActive = useExperienceStore((s) => s.micActive);
  const agentState = useExperienceStore((s) => s.agentState);
  const toggleMic = useExperienceStore((s) => s.toggleMic);
  const reduced = useReducedMotion();
  const pulsing = micActive && !reduced;

  const label = micActive ? "Listening — tap to mute" : "Tap to speak to Aurelis";

  return (
    <div className="mic-dock">
      <motion.button
        type="button"
        aria-label={label}
        title={label}
        onClick={toggleMic}
        className={`mic-button mic-button--${agentState}${micActive ? " mic-button--on" : ""}`}
        whileTap={{ scale: 0.94 }}
        animate={pulsing ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={pulsing ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"
          />
        </svg>
      </motion.button>
      <span className="mic-dock__hint">{micActive ? "Listening" : "Speak"}</span>
    </div>
  );
}
