"use client";

// The text fallback is hidden behind an icon (per the luxury copy rules). When
// voice isn't available or preferred, the guest can type a command; it runs
// through the same intent matcher the voice pipeline uses.

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { runTextCommand } from "@/lib/realtime/voiceFallback";
import { EXAMPLE_COMMANDS } from "@/config/voice-intents";
import { AGENT } from "@/config/agent";

export default function TextFallback() {
  const open = useExperienceStore((s) => s.textFallbackOpen);
  const setOpen = useExperienceStore((s) => s.setTextFallbackOpen);
  const runCommand = useExperienceStore((s) => s.runCommand);
  const speak = useExperienceStore((s) => s.speak);
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;
    const intent = runTextCommand(text);
    if (intent) runCommand(intent);
    else speak(AGENT.lines.unknown);
    setValue("");
  };

  return (
    <>
      <button
        type="button"
        className={`text-toggle${open ? " text-toggle--on" : ""}`}
        aria-label="Type a command"
        title="Type a command"
        onClick={() => setOpen(!open)}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path fill="currentColor" d="M4 5h16v2H4V5Zm0 6h16v2H4v-2Zm0 6h10v2H4v-2Z" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.form
            className="text-panel"
            onSubmit={submit}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <input
              autoFocus
              className="text-panel__input"
              placeholder={EXAMPLE_COMMANDS[0]}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button type="submit" className="text-panel__send">
              Send
            </button>
            <div className="text-panel__examples">
              {EXAMPLE_COMMANDS.slice(0, 4).map((cmd) => (
                <button
                  type="button"
                  key={cmd}
                  className="text-panel__chip"
                  onClick={() => {
                    const intent = runTextCommand(cmd);
                    if (intent) runCommand(intent);
                  }}
                >
                  {cmd}
                </button>
              ))}
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </>
  );
}
