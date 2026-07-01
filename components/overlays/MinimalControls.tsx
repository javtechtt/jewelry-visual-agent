"use client";

// Minimal luxury controls — the click/touch fallback for the voice-led flow.
// Bottom-left: the focused piece + an Add-to-Bag action. Bottom-right: Checkout.
// Everything here is also voice-driven; nothing is a card grid.

import { AnimatePresence, motion } from "framer-motion";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";

export default function MinimalControls() {
  const selectedProduct = useExperienceStore((s) => s.selectedProduct);
  const addToCart = useExperienceStore((s) => s.addToCart);
  const openDemoFlow = useExperienceStore((s) => s.openDemoFlow);
  const cart = useExperienceStore((s) => s.cart);
  const demoFlow = useExperienceStore((s) => s.demoFlow);

  // Checkout needs something to buy — the bag, or a focused piece to fold in.
  const canCheckout = cart.length > 0 || selectedProduct !== null;
  // Only prompt to add while the focused piece isn't already in the bag.
  const showAdd =
    selectedProduct !== null && !demoFlow && !cart.some((c) => c.id === selectedProduct.id);

  return (
    <>
      {/* Bottom-left: the piece in focus + add-to-bag */}
      <div className="controls controls--left">
        <AnimatePresence>
          {showAdd && selectedProduct && (
            <motion.div
              key={selectedProduct.id}
              className="focus-chip"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="focus-chip__meta">
                <span className="focus-chip__name">{selectedProduct.name}</span>
                <span className="focus-chip__price">{selectedProduct.priceLabel}</span>
              </span>
              <button
                type="button"
                className="action-btn action-btn--accent"
                onClick={() => addToCart(selectedProduct)}
              >
                Add to Bag
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom-right: checkout */}
      <div className="controls controls--right">
        <button
          type="button"
          className="action-btn action-btn--accent"
          onClick={() => openDemoFlow("checkout")}
          disabled={!canCheckout}
        >
          Checkout
        </button>
      </div>
    </>
  );
}
