"use client";

// The guest's bag. Reads the cart straight from the store (the single source of
// truth the agent mutates via add_to_cart / remove_from_cart) and offers a
// Checkout button. Hidden while empty or while a flow overlay is open.

import { AnimatePresence, motion } from "framer-motion";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { cartCount, cartTotalLabel } from "@/lib/cart";

export default function CartOverlay() {
  const cart = useExperienceStore((s) => s.cart);
  const removeFromCart = useExperienceStore((s) => s.removeFromCart);
  const openDemoFlow = useExperienceStore((s) => s.openDemoFlow);
  const demoFlow = useExperienceStore((s) => s.demoFlow);

  const show = cart.length > 0 && !demoFlow;

  return (
    <AnimatePresence>
      {show && (
        <motion.aside
          className="cart-panel"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Your bag"
        >
          <header className="cart-panel__head">
            <span className="cart-panel__title">Your Bag</span>
            <span className="cart-panel__count">{cartCount(cart)}</span>
          </header>

          <ul className="cart-list">
            {cart.map((item) => (
              <li className="cart-item" key={item.id}>
                <span className="cart-item__name">
                  {item.name}
                  {item.qty > 1 ? ` ×${item.qty}` : ""}
                </span>
                <span className="cart-item__price">{item.priceLabel}</span>
                <button
                  type="button"
                  className="cart-item__remove"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => removeFromCart(item.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <div className="cart-panel__foot">
            <span className="cart-total">{cartTotalLabel(cart)}</span>
            <button
              type="button"
              className="action-btn action-btn--accent"
              onClick={() => openDemoFlow("checkout")}
            >
              Checkout
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
