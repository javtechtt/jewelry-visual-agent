"use client";

// Demo-safe human handoff: topic + channel + details → simulated request →
// demo concierge reference. No human is actually paged in the demo.

import { useEffect, useState } from "react";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { HANDOFF_CHANNELS } from "@/config/demo-flows";
import { requestHandoff } from "@/lib/demo/demoActions";
import { hasErrors, validateHandoff } from "@/lib/demo/demoValidation";
import type { DemoReceipt, HandoffPayload, ValidationErrors } from "@/types/demo";
import {
  DemoConfirmation,
  DemoFlowShell,
  DemoProcessing,
  Field,
  StepFooter,
  type DemoStep,
} from "./DemoFlowShell";

type Form = Partial<HandoffPayload>;

export default function HandoffOverlay() {
  const open = useExperienceStore((s) => s.demoFlow === "handoff");
  const close = useExperienceStore((s) => s.closeDemoFlow);
  const setReceipt = useExperienceStore((s) => s.setReceipt);

  const [step, setStep] = useState<DemoStep>("form");
  const [form, setForm] = useState<Form>({ channel: "voice" });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [receipt, setLocalReceipt] = useState<DemoReceipt | null>(null);

  useEffect(() => {
    if (open) {
      setStep("form");
      setErrors({});
      setLocalReceipt(null);
      setForm({ channel: "voice" });
    }
  }, [open]);

  const set = (patch: Form) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    const v = validateHandoff(form);
    setErrors(v);
    if (hasErrors(v)) return;
    setStep("processing");
    const result = await requestHandoff({
      name: form.name ?? "",
      email: form.email ?? "",
      phone: form.phone ?? "",
      topic: form.topic ?? "",
      channel: form.channel ?? "voice",
      notes: form.notes ?? "",
    });
    setLocalReceipt(result);
    setReceipt(result);
    setStep("done");
  };

  return (
    <DemoFlowShell flowId="handoff" open={open} onClose={close}>
      {step === "form" && (
        <>
          <Field label="What can a concierge help with?" name="topic" errors={errors}>
            <input className="demo-input" value={form.topic ?? ""} onChange={(e) => set({ topic: e.target.value })} />
          </Field>
          <Field label="Preferred channel" name="channel" errors={errors}>
            <div className="demo-choices">
              {HANDOFF_CHANNELS.map((channel) => (
                <button
                  type="button"
                  key={channel.id}
                  className={`demo-choice${form.channel === channel.id ? " demo-choice--on" : ""}`}
                  onClick={() => set({ channel: channel.id })}
                >
                  {channel.label}
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
          <StepFooter onNext={submit} nextLabel="Connect (demo)" />
        </>
      )}

      {step === "processing" && <DemoProcessing label="Connecting you with a concierge…" />}
      {step === "done" && receipt && <DemoConfirmation receipt={receipt} onDone={close} />}
    </DemoFlowShell>
  );
}
