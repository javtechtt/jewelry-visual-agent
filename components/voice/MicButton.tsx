"use client";

// The primary, voice-first control: an exaggerated, gilded mic orb pinned
// bottom-centre that MORPHS with Aurelis' state — a mic at rest, a live emerald
// waveform while listening, orbiting gold dots while thinking, and a sapphire
// waveform with radiating rings while speaking. A rotating conic sheen frames it
// throughout for a luxe, jewellery-box feel.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import type { AgentState } from "@/types/experience";

// Per-state palette: the disc stays gilded; the icon/bars + glow carry the cue.
// (Idle/thinking use readable golds; listening/speaking use the orb's gemstones.)
const STATE_STYLE: Record<AgentState, { accent: string; glow: string; ring: string }> = {
  idle: { accent: "#7a6636", glow: "rgba(201,169,106,0.70)", ring: "rgba(228,210,168,0.50)" },
  listening: { accent: "#2faa72", glow: "rgba(47,170,114,0.78)", ring: "rgba(47,170,114,0.50)" },
  thinking: { accent: "#b8863a", glow: "rgba(201,169,106,0.78)", ring: "rgba(201,169,106,0.55)" },
  speaking: { accent: "#3a78d4", glow: "rgba(58,120,212,0.72)", ring: "rgba(58,120,212,0.48)" },
};

const HINT: Record<AgentState, string> = {
  idle: "Speak",
  listening: "Listening",
  thinking: "One moment",
  speaking: "Aurelis",
};

export default function MicButton() {
  const micActive = useExperienceStore((s) => s.micActive);
  const agentState = useExperienceStore((s) => s.agentState);
  const toggleMic = useExperienceStore((s) => s.toggleMic);
  const reduced = useReducedMotion();

  const st = STATE_STYLE[agentState] ?? STATE_STYLE.idle;
  const label = micActive ? "Listening — tap to mute" : "Tap to speak to Aurelis";
  // Sound radiates outward only while Aurelis speaks (emitting).
  const emitting = !reduced && agentState === "speaking";
  // The gilded sheen spins faster once the guest is engaged.
  const haloDur = agentState === "idle" ? 16 : 7;

  const coreScale =
    reduced || agentState === "idle"
      ? 1
      : agentState === "speaking"
        ? [1, 1.08, 1]
        : agentState === "listening"
          ? [1, 1.045, 1]
          : [1, 1.03, 1];

  return (
    <div className="mic-dock">
      <motion.button
        type="button"
        aria-label={label}
        title={label}
        onClick={toggleMic}
        className={`mic-button mic-button--${agentState}`}
        style={{ "--accent": st.accent, "--glow": st.glow, "--ring": st.ring } as CSSProperties}
        whileTap={{ scale: 0.93 }}
      >
        {/* Rotating gilded sheen */}
        <motion.span
          className="mic-button__halo"
          aria-hidden="true"
          animate={reduced ? {} : { rotate: 360 }}
          transition={reduced ? {} : { duration: haloDur, repeat: Infinity, ease: "linear" }}
        />

        {/* Radiating rings while speaking */}
        {emitting &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="mic-button__ripple"
              aria-hidden="true"
              initial={{ scale: 0.72, opacity: 0.5 }}
              animate={{ scale: 2.15, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: i * 0.5 }}
            />
          ))}

        {/* The gilded disc — breathes with the state */}
        <motion.span
          className="mic-button__core"
          aria-hidden="true"
          animate={{ scale: coreScale }}
          transition={
            reduced || agentState === "idle"
              ? { duration: 0.4 }
              : {
                  duration: agentState === "speaking" ? 0.9 : 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={agentState}
              className="mic-button__form"
              initial={{ opacity: 0, scale: 0.55 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.55 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <MicForm state={agentState} />
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </motion.button>
      <motion.span
        className="mic-dock__hint"
        key={agentState}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {HINT[agentState] ?? "Speak"}
      </motion.span>
    </div>
  );
}

/** The morphing centre of the orb. */
function MicForm({ state }: { state: AgentState }) {
  if (state === "listening") return <Bars energetic={false} />;
  if (state === "speaking") return <Bars energetic />;
  if (state === "thinking") return <Orbit />;
  return <MicGlyph />;
}

function MicGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"
      />
    </svg>
  );
}

/** A live equalizer — gentle for listening, taller/faster (with rings) for speaking. */
function Bars({ energetic }: { energetic: boolean }) {
  const reduced = useReducedMotion();
  const peaks = energetic ? [0.9, 0.5, 1, 0.6, 0.85] : [0.5, 0.8, 0.45, 0.72, 0.55];
  return (
    <span className="mic-bars" aria-hidden="true">
      {peaks.map((peak, i) => (
        <motion.span
          key={i}
          className="mic-bars__bar"
          initial={{ scaleY: 0.4 }}
          animate={reduced ? { scaleY: peak * 0.7 } : { scaleY: [0.32, peak, 0.46] }}
          transition={
            reduced
              ? { duration: 0.2 }
              : {
                  duration: (energetic ? 0.5 : 0.9) + (i % 3) * 0.08,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut",
                  delay: i * 0.07,
                }
          }
        />
      ))}
    </span>
  );
}

/** Three dots orbiting the centre while Aurelis thinks. */
function Orbit() {
  const reduced = useReducedMotion();
  return (
    <motion.span
      className="mic-orbit"
      aria-hidden="true"
      animate={reduced ? {} : { rotate: 360 }}
      transition={reduced ? {} : { duration: 1.6, repeat: Infinity, ease: "linear" }}
    >
      <span className="mic-orbit__dot" />
      <span className="mic-orbit__dot" />
      <span className="mic-orbit__dot" />
    </motion.span>
  );
}
