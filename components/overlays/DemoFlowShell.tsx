"use client";

// Shared chrome for the demo-safe flows: a compact luxury glass overlay with a
// header, a persistent demo-safe notice, and reusable processing + confirmation
// states. Keeps the four flow overlays concise and consistent.
// See docs/DEMO_SAFE_RULES.md.

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { DEMO_FLOWS } from "@/config/demo-flows";
import type { DemoFlowId } from "@/types/experience";
import type { DemoReceipt, ValidationErrors } from "@/types/demo";

export type DemoStep = "form" | "review" | "processing" | "done";

export function DemoFlowShell({
  flowId,
  open,
  onClose,
  children,
}: {
  flowId: DemoFlowId;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const config = DEMO_FLOWS[flowId];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="demo-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onClick={onClose}
        >
          <motion.section
            className="demo-panel"
            role="dialog"
            aria-modal="true"
            aria-label={config.title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="demo-panel__head">
              <div>
                <h2 className="demo-panel__title">{config.title}</h2>
                <p className="demo-panel__subtitle">{config.subtitle}</p>
              </div>
              <button type="button" className="demo-panel__close" aria-label="Close" onClick={onClose}>
                ×
              </button>
            </header>

            <p className="demo-note">{config.safeNote}</p>

            <div className="demo-panel__body">{children}</div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DemoProcessing({ label = "Preparing your request…" }: { label?: string }) {
  return (
    <div className="demo-processing">
      <span className="demo-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function DemoConfirmation({
  receipt,
  onDone,
}: {
  receipt: DemoReceipt;
  onDone: () => void;
}) {
  return (
    <motion.div
      className="demo-confirm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="demo-confirm__badge">Demo confirmation</span>
      <p className="demo-confirm__ref">{receipt.reference}</p>
      <p className="demo-confirm__summary">{receipt.summary}</p>
      <p className="demo-confirm__time">{receipt.createdLabel}</p>
      <p className="demo-confirm__note">{receipt.productionNote}</p>
      <button type="button" className="action-btn action-btn--accent demo-confirm__done" onClick={onDone}>
        Return to Aurelis
      </button>
    </motion.div>
  );
}

export function Field({
  label,
  name,
  errors,
  children,
}: {
  label: string;
  name: string;
  errors: ValidationErrors;
  children: ReactNode;
}) {
  return (
    <label className="demo-field">
      <span className="demo-field__label">{label}</span>
      {children}
      {errors[name] && <span className="demo-field__error">{errors[name]}</span>}
    </label>
  );
}

export function StepFooter({
  onBack,
  backLabel = "Back",
  onNext,
  nextLabel,
  nextDisabled,
}: {
  onBack?: () => void;
  backLabel?: string;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="demo-footer">
      {onBack ? (
        <button type="button" className="ghost-btn" onClick={onBack}>
          {backLabel}
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        className="action-btn action-btn--accent"
        onClick={onNext}
        disabled={nextDisabled}
      >
        {nextLabel}
      </button>
    </div>
  );
}
