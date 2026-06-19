"use client";

// Demo-safe lead capture: details + interest + consent → simulated submit →
// demo lead reference. Stored only in local state; no CRM/email is contacted.

import { useEffect, useState } from "react";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { LEAD_INTERESTS } from "@/config/demo-flows";
import { submitLead } from "@/lib/demo/demoActions";
import { hasErrors, validateLead } from "@/lib/demo/demoValidation";
import type { DemoReceipt, LeadPayload, ValidationErrors } from "@/types/demo";
import {
  DemoConfirmation,
  DemoFlowShell,
  DemoProcessing,
  Field,
  StepFooter,
  type DemoStep,
} from "./DemoFlowShell";

type Form = Partial<LeadPayload>;

export default function LeadCaptureOverlay() {
  const open = useExperienceStore((s) => s.demoFlow === "lead");
  const close = useExperienceStore((s) => s.closeDemoFlow);
  const setReceipt = useExperienceStore((s) => s.setReceipt);

  const [step, setStep] = useState<DemoStep>("form");
  const [form, setForm] = useState<Form>({ interest: LEAD_INTERESTS[0], consent: false });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [receipt, setLocalReceipt] = useState<DemoReceipt | null>(null);

  useEffect(() => {
    if (open) {
      setStep("form");
      setErrors({});
      setLocalReceipt(null);
      setForm({ interest: LEAD_INTERESTS[0], consent: false });
    }
  }, [open]);

  const set = (patch: Form) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    const v = validateLead(form);
    setErrors(v);
    if (hasErrors(v)) return;
    setStep("processing");
    const result = await submitLead({
      name: form.name ?? "",
      email: form.email ?? "",
      phone: form.phone ?? "",
      interest: form.interest ?? LEAD_INTERESTS[0],
      notes: form.notes ?? "",
      consent: Boolean(form.consent),
    });
    setLocalReceipt(result);
    setReceipt(result);
    setStep("done");
  };

  return (
    <DemoFlowShell flowId="lead" open={open} onClose={close}>
      {step === "form" && (
        <>
          <Field label="Name" name="name" errors={errors}>
            <input className="demo-input" value={form.name ?? ""} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Email" name="email" errors={errors}>
            <input className="demo-input" value={form.email ?? ""} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Phone" name="phone" errors={errors}>
            <input className="demo-input" value={form.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="Interested in" name="interest" errors={errors}>
            <div className="demo-choices">
              {LEAD_INTERESTS.map((interest) => (
                <button
                  type="button"
                  key={interest}
                  className={`demo-choice${form.interest === interest ? " demo-choice--on" : ""}`}
                  onClick={() => set({ interest })}
                >
                  {interest}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Notes (optional)" name="notes" errors={errors}>
            <textarea className="demo-input demo-input--area" rows={2} value={form.notes ?? ""} onChange={(e) => set({ notes: e.target.value })} />
          </Field>
          <label className="demo-consent">
            <input type="checkbox" checked={Boolean(form.consent)} onChange={(e) => set({ consent: e.target.checked })} />
            <span>I'm happy for a stylist to follow up (demo — nothing is sent).</span>
          </label>
          {errors.consent && <span className="demo-field__error">{errors.consent}</span>}
          <StepFooter onNext={submit} nextLabel="Submit (demo)" />
        </>
      )}

      {step === "processing" && <DemoProcessing label="Noting your details…" />}
      {step === "done" && receipt && <DemoConfirmation receipt={receipt} onDone={close} />}
    </DemoFlowShell>
  );
}
