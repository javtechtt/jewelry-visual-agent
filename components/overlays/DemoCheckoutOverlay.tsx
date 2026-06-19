"use client";

// Demo-safe checkout: selection summary → details → review → simulated
// processing → demo receipt. Never collects a real card; never charges.

import { useEffect, useState } from "react";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { PAYMENT_METHODS } from "@/config/demo-flows";
import { runCheckout } from "@/lib/demo/demoActions";
import { hasErrors, validateCheckout } from "@/lib/demo/demoValidation";
import type { CheckoutPayload, DemoReceipt, ValidationErrors } from "@/types/demo";
import {
  DemoConfirmation,
  DemoFlowShell,
  DemoProcessing,
  Field,
  StepFooter,
  type DemoStep,
} from "./DemoFlowShell";

type Form = Partial<CheckoutPayload>;

export default function DemoCheckoutOverlay() {
  const open = useExperienceStore((s) => s.demoFlow === "checkout");
  const close = useExperienceStore((s) => s.closeDemoFlow);
  const setReceipt = useExperienceStore((s) => s.setReceipt);
  const selected = useExperienceStore((s) => s.selectedProduct);

  const productName = selected?.name ?? "Selected piece";
  const priceLabel = selected?.priceLabel ?? "By request";

  const [step, setStep] = useState<DemoStep>("form");
  const [form, setForm] = useState<Form>({ paymentMethod: "demo-card", consent: false });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [receipt, setLocalReceipt] = useState<DemoReceipt | null>(null);

  useEffect(() => {
    if (open) {
      setStep("form");
      setErrors({});
      setLocalReceipt(null);
      setForm({ paymentMethod: "demo-card", consent: false });
    }
  }, [open]);

  const set = (patch: Form) => setForm((f) => ({ ...f, ...patch }));

  const toReview = () => {
    const payload: Partial<CheckoutPayload> = { ...form, productName, priceLabel, productId: selected?.id ?? "demo" };
    const v = validateCheckout(payload);
    setErrors(v);
    if (!hasErrors(v)) setStep("review");
  };

  const confirm = async () => {
    setStep("processing");
    const result = await runCheckout({
      name: form.name ?? "",
      email: form.email ?? "",
      phone: form.phone ?? "",
      productId: selected?.id ?? "demo",
      productName,
      priceLabel,
      paymentMethod: form.paymentMethod ?? "demo-card",
      consent: Boolean(form.consent),
    });
    setLocalReceipt(result);
    setReceipt(result);
    setStep("done");
  };

  return (
    <DemoFlowShell flowId="checkout" open={open} onClose={close}>
      <div className="demo-summary">
        <span className="demo-summary__label">Reserving</span>
        <span className="demo-summary__value">{productName}</span>
        <span className="demo-summary__price">{priceLabel}</span>
      </div>

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
          <Field label="Payment (placeholder)" name="paymentMethod" errors={errors}>
            <div className="demo-choices">
              {PAYMENT_METHODS.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  className={`demo-choice${form.paymentMethod === m.id ? " demo-choice--on" : ""}`}
                  onClick={() => set({ paymentMethod: m.id })}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </Field>
          <label className="demo-consent">
            <input
              type="checkbox"
              checked={Boolean(form.consent)}
              onChange={(e) => set({ consent: e.target.checked })}
            />
            <span>I understand this is a demo and no payment will be taken.</span>
          </label>
          {errors.consent && <span className="demo-field__error">{errors.consent}</span>}
          <StepFooter onNext={toReview} nextLabel="Review" />
        </>
      )}

      {step === "review" && (
        <>
          <ul className="demo-review">
            <li><span>Piece</span><span>{productName}</span></li>
            <li><span>Price</span><span>{priceLabel}</span></li>
            <li><span>Name</span><span>{form.name}</span></li>
            <li><span>Email</span><span>{form.email}</span></li>
            <li><span>Payment</span><span>{PAYMENT_METHODS.find((m) => m.id === form.paymentMethod)?.label}</span></li>
          </ul>
          <StepFooter onBack={() => setStep("form")} onNext={confirm} nextLabel="Confirm (demo)" />
        </>
      )}

      {step === "processing" && <DemoProcessing label="Preparing your private checkout…" />}
      {step === "done" && receipt && <DemoConfirmation receipt={receipt} onDone={close} />}
    </DemoFlowShell>
  );
}
