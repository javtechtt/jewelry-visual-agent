"use client";

// A three-screen checkout that feels like a real luxury purchase:
//   details → payment → confirmation
// The form lives in the store, so Aurelis can fill the contact fields in real
// time (set_checkout_details) while the guest simply talks. The card fields on
// the payment screen are LOCAL + ephemeral — never stored, never transmitted.

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { PAYMENT_METHODS } from "@/config/demo-flows";
import { cartTotalLabel } from "@/lib/cart";
import { isEmail } from "@/lib/demo/demoValidation";
import type { CartItem } from "@/types/demo";
import { DemoConfirmation, DemoFlowShell, DemoProcessing } from "./DemoFlowShell";

const STEPS = [
  { id: "details", label: "Details" },
  { id: "payment", label: "Payment" },
  { id: "confirmation", label: "Confirmed" },
] as const;

const STEP_SUBTITLE: Record<string, string> = {
  details: "Where shall we send your order?",
  payment: "Complete your purchase securely.",
  processing: "Securing your order…",
  confirmation: "Thank you — your order is confirmed.",
};

const screenTransition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const };

export default function DemoCheckoutOverlay() {
  const open = useExperienceStore((s) => s.demoFlow === "checkout");
  const close = useExperienceStore((s) => s.closeDemoFlow);
  const cart = useExperienceStore((s) => s.cart);
  const selectedProduct = useExperienceStore((s) => s.selectedProduct);
  const addToCart = useExperienceStore((s) => s.addToCart);
  const checkout = useExperienceStore((s) => s.checkout);
  const step = useExperienceStore((s) => s.checkoutStep);
  const filled = useExperienceStore((s) => s.checkoutFilled);
  const updateCheckout = useExperienceStore((s) => s.updateCheckout);
  const setStep = useExperienceStore((s) => s.setCheckoutStep);
  const placeOrder = useExperienceStore((s) => s.placeOrder);
  const receipt = useExperienceStore((s) => s.lastReceipt);

  // Card entry is kept here, in local component state only — it never reaches the
  // store, a receipt, or the network.
  const [card, setCard] = useState({ number: "", exp: "", cvc: "" });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Opened with an empty bag but a focused piece? Fold it in so there's an order.
    if (cart.length === 0 && selectedProduct) addToCart(selectedProduct);
    setCard({ number: "", exp: "", cvc: "" });
    setTouched(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = cartTotalLabel(cart);
  const detailsComplete =
    Boolean(checkout.name.trim()) && isEmail(checkout.email) && Boolean(checkout.phone.trim());

  const toPayment = () => {
    setTouched(true);
    if (detailsComplete) setStep("payment");
  };

  // Progress index: the transient "processing" state still sits under Payment.
  const activeIndex = STEPS.findIndex(
    (s) => s.id === (step === "processing" ? "payment" : step),
  );

  return (
    <DemoFlowShell flowId="checkout" open={open} onClose={close} subtitle={STEP_SUBTITLE[step]}>
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
        {step === "details" && (
          <motion.div
            key="details"
            className="checkout-screen"
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={screenTransition}
          >
            <OrderSummary cart={cart} total={total} />
            <div className="checkout-fields">
              <LiveField
                label="Full name"
                value={checkout.name}
                highlight={filled.includes("name")}
                error={touched && !checkout.name.trim() ? "Please enter a name." : ""}
                onChange={(v) => updateCheckout({ name: v })}
                autoComplete="name"
              />
              <LiveField
                label="Email"
                value={checkout.email}
                highlight={filled.includes("email")}
                error={touched && !isEmail(checkout.email) ? "Enter a valid email." : ""}
                onChange={(v) => updateCheckout({ email: v })}
                autoComplete="email"
                inputMode="email"
              />
              <LiveField
                label="Phone"
                value={checkout.phone}
                highlight={filled.includes("phone")}
                error={touched && !checkout.phone.trim() ? "Please enter a phone." : ""}
                onChange={(v) => updateCheckout({ phone: v })}
                autoComplete="tel"
                inputMode="tel"
              />
            </div>
            <div className="checkout-actions">
              <button type="button" className="ghost-btn" onClick={close}>
                Cancel
              </button>
              <button type="button" className="action-btn action-btn--accent" onClick={toPayment}>
                Continue to payment
              </button>
            </div>
          </motion.div>
        )}

        {step === "payment" && (
          <motion.div
            key="payment"
            className="checkout-screen"
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={screenTransition}
          >
            <div className="checkout-paytotal">
              <span>Amount due</span>
              <strong>{total}</strong>
            </div>

            <div className="checkout-methods">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`checkout-method${
                    checkout.paymentMethod === m.id ? " checkout-method--on" : ""
                  }`}
                  onClick={() => updateCheckout({ paymentMethod: m.id })}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <AnimatePresence initial={false}>
              {checkout.paymentMethod === "card" && (
                <motion.div
                  key="card"
                  className="checkout-card"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <CardField
                    label="Card number"
                    placeholder="1234 5678 9012 3456"
                    value={card.number}
                    onChange={(v) => setCard((c) => ({ ...c, number: formatCardNumber(v) }))}
                  />
                  <div className="checkout-card__row">
                    <CardField
                      label="Expiry"
                      placeholder="MM / YY"
                      value={card.exp}
                      onChange={(v) => setCard((c) => ({ ...c, exp: formatExpiry(v) }))}
                    />
                    <CardField
                      label="CVC"
                      placeholder="•••"
                      value={card.cvc}
                      onChange={(v) => setCard((c) => ({ ...c, cvc: v.replace(/\D/g, "").slice(0, 4) }))}
                    />
                  </div>
                  <p className="checkout-secure">
                    <span className="checkout-secure__lock" aria-hidden="true">
                      ◈
                    </span>
                    Encrypted &amp; secure
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="checkout-terms">
              By placing your order you agree to the Terms of Sale and Privacy Policy.
            </p>

            <div className="checkout-actions">
              <button type="button" className="ghost-btn" onClick={() => setStep("details")}>
                Back
              </button>
              <button
                type="button"
                className="action-btn action-btn--accent"
                onClick={() => void placeOrder()}
              >
                Pay {total}
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
            <DemoProcessing label="Securing your order…" />
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

function OrderSummary({ cart, total }: { cart: CartItem[]; total: string }) {
  return (
    <div className="checkout-summary">
      <ul className="checkout-lines">
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
      <div className="checkout-summary__total">
        <span>Total</span>
        <span>{total}</span>
      </div>
    </div>
  );
}

function LiveField({
  label,
  value,
  onChange,
  error,
  highlight,
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  highlight?: boolean;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
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
      {error && <span className="demo-field__error">{error}</span>}
    </label>
  );
}

function CardField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="demo-field">
      <span className="demo-field__label">{label}</span>
      <input
        className="demo-input checkout-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        inputMode="numeric"
      />
    </label>
  );
}

function formatCardNumber(v: string): string {
  return v
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}
