"use client";

// A three-screen appointment flow built around a live calendar:
//   schedule (calendar + time) → details → confirmation
// The form lives in the store, so Aurelis can fill the date, time, and contact
// details in real time (set_appointment) while the guest simply talks.

import { AnimatePresence, motion } from "framer-motion";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { CATEGORY_MAP } from "@/config/categories";
import { APPOINTMENT_TIMES } from "@/config/demo-flows";
import { isEmail } from "@/lib/demo/demoValidation";
import { DemoConfirmation, DemoFlowShell, DemoProcessing } from "./DemoFlowShell";
import Calendar from "./Calendar";

const STEPS = [
  { id: "schedule", label: "Date & time" },
  { id: "details", label: "Details" },
  { id: "confirmation", label: "Confirmed" },
] as const;

const STEP_SUBTITLE: Record<string, string> = {
  schedule: "Choose a date and time that suits you.",
  details: "A few details to confirm your visit.",
  processing: "Arranging your appointment…",
  confirmation: "Your appointment is confirmed.",
};

const screenTransition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const };

function prettyDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export default function DemoBookingOverlay() {
  const open = useExperienceStore((s) => s.demoFlow === "booking");
  const close = useExperienceStore((s) => s.closeDemoFlow);
  const activeCategory = useExperienceStore((s) => s.activeCategory);
  const booking = useExperienceStore((s) => s.booking);
  const step = useExperienceStore((s) => s.bookingStep);
  const filled = useExperienceStore((s) => s.bookingFilled);
  const updateBooking = useExperienceStore((s) => s.updateBooking);
  const setStep = useExperienceStore((s) => s.setBookingStep);
  const confirmBooking = useExperienceStore((s) => s.confirmBooking);
  const receipt = useExperienceStore((s) => s.lastReceipt);

  const service = activeCategory
    ? `${CATEGORY_MAP[activeCategory].label} consultation`
    : "Private appointment";
  const scheduleReady = Boolean(booking.date && booking.time);
  const detailsReady =
    Boolean(booking.name.trim()) && isEmail(booking.email) && Boolean(booking.phone.trim());

  const activeIndex = STEPS.findIndex(
    (s) => s.id === (step === "processing" ? "details" : step),
  );

  return (
    <DemoFlowShell flowId="booking" open={open} onClose={close} subtitle={STEP_SUBTITLE[step]}>
      <div className="demo-summary">
        <span className="demo-summary__label">Appointment</span>
        <span className="demo-summary__value">{service}</span>
        {scheduleReady && step !== "schedule" && (
          <span className="demo-summary__price">
            {prettyDate(booking.date)} · {booking.time}
          </span>
        )}
      </div>

      <ol className="checkout-steps" aria-hidden="true">
        {STEPS.map((s, i) => (
          <li
            key={s.id}
            className={`checkout-step${i === activeIndex ? " checkout-step--on" : ""}${
              i < activeIndex ? " checkout-step--done" : ""
            }`}
          >
            <span className="checkout-step__dot" />
            <span className="checkout-step__label">{s.label}</span>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        {step === "schedule" && (
          <motion.div
            key="schedule"
            className="checkout-screen"
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={screenTransition}
          >
            <Calendar value={booking.date} onSelect={(d) => updateBooking({ date: d })} />
            <div className="booking-times">
              {APPOINTMENT_TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`demo-choice${booking.time === t ? " demo-choice--on" : ""}`}
                  onClick={() => updateBooking({ time: t })}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="checkout-actions">
              <button type="button" className="ghost-btn" onClick={close}>
                Cancel
              </button>
              <button
                type="button"
                className="action-btn action-btn--accent"
                onClick={() => scheduleReady && setStep("details")}
                disabled={!scheduleReady}
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {step === "details" && (
          <motion.div
            key="details"
            className="checkout-screen"
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={screenTransition}
          >
            <div className="checkout-fields">
              <LiveField
                label="Full name"
                value={booking.name}
                highlight={filled.includes("name")}
                onChange={(v) => updateBooking({ name: v })}
                autoComplete="name"
              />
              <LiveField
                label="Email"
                value={booking.email}
                highlight={filled.includes("email")}
                onChange={(v) => updateBooking({ email: v })}
                autoComplete="email"
                inputMode="email"
              />
              <LiveField
                label="Phone"
                value={booking.phone}
                highlight={filled.includes("phone")}
                onChange={(v) => updateBooking({ phone: v })}
                autoComplete="tel"
                inputMode="tel"
              />
              <label className="demo-field">
                <span className="demo-field__label">Notes (optional)</span>
                <textarea
                  className="demo-input demo-input--area"
                  rows={2}
                  value={booking.notes}
                  onChange={(e) => updateBooking({ notes: e.target.value })}
                />
              </label>
            </div>
            <div className="checkout-actions">
              <button type="button" className="ghost-btn" onClick={() => setStep("schedule")}>
                Back
              </button>
              <button
                type="button"
                className="action-btn action-btn--accent"
                onClick={() => void confirmBooking()}
                disabled={!detailsReady}
              >
                Book appointment
              </button>
            </div>
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div
            key="processing"
            className="checkout-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={screenTransition}
          >
            <DemoProcessing label="Arranging your appointment…" />
          </motion.div>
        )}

        {step === "confirmation" && receipt && (
          <motion.div
            key="confirmation"
            className="checkout-screen"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={screenTransition}
          >
            <DemoConfirmation receipt={receipt} onDone={close} />
          </motion.div>
        )}
      </AnimatePresence>
    </DemoFlowShell>
  );
}

function LiveField({
  label,
  value,
  onChange,
  highlight,
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  highlight?: boolean;
  autoComplete?: string;
  inputMode?: "email" | "tel" | "text" | "numeric";
}) {
  return (
    <label className="demo-field">
      <span className="demo-field__label">{label}</span>
      <motion.input
        className="demo-input checkout-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        animate={
          highlight
            ? {
                boxShadow: [
                  "0 0 0 0 rgba(201,169,106,0)",
                  "0 0 0 3px rgba(201,169,106,0.5)",
                  "0 0 0 0 rgba(201,169,106,0)",
                ],
              }
            : { boxShadow: "0 0 0 0 rgba(201,169,106,0)" }
        }
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </label>
  );
}
