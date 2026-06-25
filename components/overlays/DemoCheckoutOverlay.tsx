"use client";

// Checkout over the guest's bag (the store's cart — the order source of truth):
// order summary → details → review → processing → confirmation. No real card is
// collected and nothing is charged (see lib/demo/demoActions).

import { useEffect, useState } from "react";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { PAYMENT_METHODS } from "@/config/demo-flows";
import { cartTotalLabel } from "@/lib/cart";
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
  const cart = useExperienceStore((s) => s.cart);
  const clearCart = useExperienceStore((s) => s.clearCart);
  const selectedProduct = useExperienceStore((s) => s.selectedProduct);
  const addToCart = useExperienceStore((s) => s.addToCart);

  const [step, setStep] = useState<DemoStep>("form");
  const [form, setForm] = useState<Form>({ paymentMethod: "demo-card", consent: false });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [receipt, setLocalReceipt] = useState<DemoReceipt | null>(null);

  useEffect(() => {
    if (open) {
      // Opened checkout directly with nothing in the bag? Fold in the focused piece.
      if (cart.length === 0 && selectedProduct) addToCart(selectedProduct);
      setStep("form");
      setErrors({});
      setLocalReceipt(null);
      setForm({ paymentMethod: "demo-card", consent: false });
    }
  }, [open]);

  const set = (patch: Form) => setForm((f) => ({ ...f, ...patch }));
  const total = cartTotalLabel(cart);

  const toReview = () => {
    const v = validateCheckout(form);
    setErrors(v);
    if (!hasErrors(v)) setStep("review");
  };

  const confirm = async () => {
    setStep("processing");
    const result = await runCheckout({
      name: form.name ?? "",
      email: form.email ?? "",
      phone: form.phone ?? "",
      paymentMethod: form.paymentMethod ?? "demo-card",
      consent: Boolean(form.consent),
      items: cart.map((c) => ({ name: c.name, priceLabel: c.priceLabel, qty: c.qty })),
      total,
    });
    clearCart();
    setLocalReceipt(result);
    setReceipt(result);
    setStep("done");
  };

  return (
    <DemoFlowShell flowId="checkout" open={open} onClose={close}>
      {step !== "done" && (
        <div className="demo-summary">
          <span className="demo-summary__label">Your order</span>
          {cart.length === 0 ? (
            <span className="demo-summary__value">Your bag is empty</span>
          ) : (
            <ul className="demo-cartlines">
              {cart.map((c) => (
                <li key={c.id}>
                  <span>
                    {c.name}
                    {c.qty > 1 ? ` ×${c.qty}` : ""}
                  </span>
                  <span>{c.priceLabel}</span>
                </li>
              ))}
            </ul>
          )}
          {cart.length > 0 && <span className="demo-summary__price">Total · {total}</span>}
        </div>
      )}

      {step === "form" && cart.length > 0 && (
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
          <Field label="Payment" name="paymentMethod" errors={errors}>
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
            <span>I agree to the Terms of Sale.</span>
          </label>
          {errors.consent && <span className="demo-field__error">{errors.consent}</span>}
          <StepFooter onNext={toReview} nextLabel="Review" />
        </>
      )}

      {step === "review" && (
        <>
          <ul className="demo-review">
            {cart.map((c) => (
              <li key={c.id}>
                <span>
                  {c.name}
                  {c.qty > 1 ? ` ×${c.qty}` : ""}
                </span>
                <span>{c.priceLabel}</span>
              </li>
            ))}
            <li>
              <span>Total</span>
              <span>{total}</span>
            </li>
            <li>
              <span>Name</span>
              <span>{form.name}</span>
            </li>
            <li>
              <span>Email</span>
              <span>{form.email}</span>
            </li>
            <li>
              <span>Payment</span>
              <span>{PAYMENT_METHODS.find((m) => m.id === form.paymentMethod)?.label}</span>
            </li>
          </ul>
          <StepFooter onBack={() => setStep("form")} onNext={confirm} nextLabel="Place order" />
        </>
      )}

      {step === "processing" && <DemoProcessing label="Placing your order…" />}
      {step === "done" && receipt && <DemoConfirmation receipt={receipt} onDone={close} />}
    </DemoFlowShell>
  );
}
