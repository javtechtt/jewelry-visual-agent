"use client";

// Demo-safe appointment booking: pick a demo slot → details → review →
// simulated processing → demo reference. No real calendar/availability.

import { useEffect, useState } from "react";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { CATEGORY_MAP } from "@/config/categories";
import { DEMO_TIME_SLOTS } from "@/config/demo-flows";
import { runBooking } from "@/lib/demo/demoActions";
import { hasErrors, validateBooking } from "@/lib/demo/demoValidation";
import type { BookingPayload, DemoReceipt, ValidationErrors } from "@/types/demo";
import {
  DemoConfirmation,
  DemoFlowShell,
  DemoProcessing,
  Field,
  StepFooter,
  type DemoStep,
} from "./DemoFlowShell";

type Form = Partial<BookingPayload>;

export default function DemoBookingOverlay() {
  const open = useExperienceStore((s) => s.demoFlow === "booking");
  const close = useExperienceStore((s) => s.closeDemoFlow);
  const setReceipt = useExperienceStore((s) => s.setReceipt);
  const activeCategory = useExperienceStore((s) => s.activeCategory);

  const service = activeCategory ? `${CATEGORY_MAP[activeCategory].label} consultation` : "Private appointment";

  const [step, setStep] = useState<DemoStep>("form");
  const [form, setForm] = useState<Form>({});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [receipt, setLocalReceipt] = useState<DemoReceipt | null>(null);

  useEffect(() => {
    if (open) {
      setStep("form");
      setErrors({});
      setLocalReceipt(null);
      setForm({ date: DEMO_TIME_SLOTS[0] });
    }
  }, [open]);

  const set = (patch: Form) => setForm((f) => ({ ...f, ...patch }));

  const toReview = () => {
    const v = validateBooking(form);
    setErrors(v);
    if (!hasErrors(v)) setStep("review");
  };

  const confirm = async () => {
    setStep("processing");
    const result = await runBooking({
      name: form.name ?? "",
      email: form.email ?? "",
      phone: form.phone ?? "",
      categoryId: activeCategory ?? "general",
      service,
      date: form.date ?? DEMO_TIME_SLOTS[0],
      time: "",
      notes: form.notes ?? "",
    });
    setLocalReceipt(result);
    setReceipt(result);
    setStep("done");
  };

  return (
    <DemoFlowShell flowId="booking" open={open} onClose={close}>
      <div className="demo-summary">
        <span className="demo-summary__label">Appointment</span>
        <span className="demo-summary__value">{service}</span>
      </div>

      {step === "form" && (
        <>
          <Field label="Preferred demo slot" name="date" errors={errors}>
            <div className="demo-choices">
              {DEMO_TIME_SLOTS.map((slot) => (
                <button
                  type="button"
                  key={slot}
                  className={`demo-choice${form.date === slot ? " demo-choice--on" : ""}`}
                  onClick={() => set({ date: slot })}
                >
                  {slot}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Name" name="name" errors={errors}>
            <input className="demo-input" value={form.name ?? ""} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Email" name="email" errors={errors}>
            <input className="demo-input" value={form.email ?? ""} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Phone" name="phone" errors={errors}>
            <input className="demo-input" value={form.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="Notes (optional)" name="notes" errors={errors}>
            <textarea className="demo-input demo-input--area" rows={2} value={form.notes ?? ""} onChange={(e) => set({ notes: e.target.value })} />
          </Field>
          <StepFooter onNext={toReview} nextLabel="Review" />
        </>
      )}

      {step === "review" && (
        <>
          <ul className="demo-review">
            <li><span>Service</span><span>{service}</span></li>
            <li><span>Slot</span><span>{form.date}</span></li>
            <li><span>Name</span><span>{form.name}</span></li>
            <li><span>Email</span><span>{form.email}</span></li>
          </ul>
          <StepFooter onBack={() => setStep("form")} onNext={confirm} nextLabel="Request (demo)" />
        </>
      )}

      {step === "processing" && <DemoProcessing label="Arranging your private appointment…" />}
      {step === "done" && receipt && <DemoConfirmation receipt={receipt} onDone={close} />}
    </DemoFlowShell>
  );
}
