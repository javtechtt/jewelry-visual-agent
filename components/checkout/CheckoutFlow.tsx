"use client";

// The checkout — its own page (route /checkout), NOT a modal over the boutique.
// Full-screen, on-brand, with the flow as distinct screens: details -> payment
// -> processing -> confirmation, driven by the store's checkoutStep. The whole
// form lives in the store, so Aurelis keeps filling the contact + card fields in
// real time (the voice layer persists across the route). Card data is held only
// for the session and is NEVER included in a receipt or sent anywhere.

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { PAYMENT_METHODS } from "@/config/demo-flows";
import { cartTotalLabel } from "@/lib/cart";
import { isEmail } from "@/lib/demo/demoValidation";
import { formatCardNumber, formatCvc, formatExpiry } from "@/lib/demo/cardFormat";
import type { CartItem } from "@/types/demo";

const STEPS = [
  { id: "details", label: "Details" },
  { id: "payment", label: "Payment" },
  { id: "confirmation", label: "Confirmed" },
] as const;

const STEP_SUBTITLE: Record<string, string> = {
  details: "Where shall we send your order?",
  payment: "Complete your purchase securely.",
  processing: "Securing your order…",
  confirmation: "Your order is confirmed.",
};

const screenTransition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const };

export default function CheckoutFlow() {
  const router = useRouter();
  const cart = useExperienceStore((s) => s.cart);
  const checkout = useExperienceStore((s) => s.checkout);
  const step = useExperienceStore((s) => s.checkoutStep);
  const filled = useExperienceStore((s) => s.checkoutFilled);
  const updateCheckout = useExperienceStore((s) => s.updateCheckout);
  const updateCard = useExperienceStore((s) => s.updateCard);
  const card = useExperienceStore((s) => s.checkoutCard);
  const setStep = useExperienceStore((s) => s.setCheckoutStep);
  const placeOrder = useExperienceStore((s) => s.placeOrder);
  const receipt = useExperienceStore((s) => s.lastReceipt);

  const [mounted, setMounted] = useState(false);
  const [touched, setTouched] = useState(false);

  // The store is the source of truth (never SSR-rendered with real state). Fold a
  // focused piece into the bag; if there is genuinely nothing to buy (e.g. a
  // direct visit / refresh), return to the boutique.
  useEffect(() => {
    const s = useExperienceStore.getState();
    if (s.cart.length === 0) {
      if (s.selectedProduct) s.addToCart(s.selectedProduct);
      else {
        router.replace("/");
        return;
      }
    }
    setMounted(true);
  }, [router]);

  // Leaving the page — Return, Cancel, Back, or after the order — closes the flow
  // (clears demoFlow + resets the form) so the boutique is clean on return.
  useEffect(() => {
    return () => {
      useExperienceStore.getState().closeDemoFlow();
    };
  }, []);

  const leave = () => router.push("/");

  const total = cartTotalLabel(cart);
  const detailsComplete =
    Boolean(checkout.name.trim()) && isEmail(checkout.email) && Boolean(checkout.phone.trim());
  const toPayment = () => {
    setTouched(true);
    if (detailsComplete) setStep("payment");
  };

  // Progress index: the transient "processing" state still sits under Payment.
  const activeIndex = STEPS.findIndex((s) => s.id === (step === "processing" ? "payment" : step));

  if (!mounted) {
    return (
      <div className="checkout-page checkout-page--booting">
        <span className="demo-spinner" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-page__inner">
        <div className="checkout-page__top">
          <div>
            <p className="checkout-page__eyebrow">Aurelis · Secure Checkout</p>
            <p className="checkout-page__subtitle">{STEP_SUBTITLE[step]}</p>
          </div>
          {(step === "details" || step === "payment") && (
            <button type="button" className="ghost-btn" onClick={leave}>
              ← Boutique
            </button>
          )}
        </div>

        <div className="checkout-page__panel">
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
                  <button type="button" className="ghost-btn" onClick={leave}>
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
                        highlight={filled.includes("number")}
                        onChange={(v) => updateCard({ number: formatCardNumber(v) })}
                      />
                      <div className="checkout-card__row">
                        <CardField
                          label="Expiry"
                          placeholder="MM / YY"
                          value={card.exp}
                          highlight={filled.includes("exp")}
                          onChange={(v) => updateCard({ exp: formatExpiry(v) })}
                        />
                        <CardField
                          label="CVC"
                          placeholder="•••"
                          value={card.cvc}
                          highlight={filled.includes("cvc")}
                          onChange={(v) => updateCard({ cvc: formatCvc(v) })}
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
                    disabled={cart.length === 0}
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
                <div className="demo-processing">
                  <span className="demo-spinner" aria-hidden="true" />
                  <p>Securing your order…</p>
                </div>
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
                <div className="demo-confirm">
                  <span className="demo-confirm__badge">Order confirmed</span>
                  <p className="demo-confirm__ref">{receipt.reference}</p>
                  <p className="demo-confirm__summary">{receipt.summary}</p>
                  <p className="demo-confirm__time">{receipt.createdLabel}</p>
                  <p className="demo-confirm__note">{receipt.productionNote}</p>
                  <button
                    type="button"
                    className="action-btn action-btn--accent demo-confirm__done"
                    onClick={leave}
                  >
                    Return to Aurelis
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
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
  highlight,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  highlight?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="demo-field">
      <span className="demo-field__label">{label}</span>
      <motion.input
        className="demo-input checkout-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        inputMode="numeric"
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
