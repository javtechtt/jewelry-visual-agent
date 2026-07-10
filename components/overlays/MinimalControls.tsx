"use client";

// Minimal luxury controls — the click/touch/keyboard layer over the voice-led
// flow. When a piece is focused it becomes a glass "focus card" (name · price ·
// tagline + Add to Bag · Ask Aurelis · ← Collection). Also hosts the keyboard
// navigation and screen-reader-reachable buttons for the 3D pieces (meshes
// aren't focusable). Checkout sits bottom-right. Nothing here is a card grid.

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { PRODUCT_MAP, PRODUCTS } from "@/config/products";
import { EASE } from "@/config/motion";

export default function MinimalControls() {
  const selectedProduct = useExperienceStore((s) => s.selectedProduct);
  const selectProduct = useExperienceStore((s) => s.selectProduct);
  const clearSelectedProduct = useExperienceStore((s) => s.clearSelectedProduct);
  const focusNextProduct = useExperienceStore((s) => s.focusNextProduct);
  const addToCart = useExperienceStore((s) => s.addToCart);
  const openDemoFlow = useExperienceStore((s) => s.openDemoFlow);
  const setMicActive = useExperienceStore((s) => s.setMicActive);
  const cart = useExperienceStore((s) => s.cart);
  const demoFlow = useExperienceStore((s) => s.demoFlow);
  const view = useExperienceStore((s) => s.view);

  const canCheckout = cart.length > 0 || selectedProduct !== null;
  const focused = selectedProduct !== null && !demoFlow;
  const product = selectedProduct ? PRODUCT_MAP[selectedProduct.id] : undefined;
  const inCart = selectedProduct ? cart.some((c) => c.id === selectedProduct.id) : false;

  // Keyboard: Esc exits focus; ← / → move between pieces (arc views only).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedProduct || demoFlow) return;
      if (e.key === "Escape") {
        e.preventDefault();
        clearSelectedProduct();
      } else if (view !== "portrait" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.preventDefault();
        focusNextProduct(e.key === "ArrowRight" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedProduct, demoFlow, view, clearSelectedProduct, focusNextProduct]);

  return (
    <>
      {/* Keyboard / screen-reader access to each piece — the 3D meshes can't take
          focus. Visually hidden; each reveals as a pill with a ring when tabbed. */}
      <nav className="piece-keys" aria-label="The collection">
        {PRODUCTS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="piece-keys__btn"
            onClick={() => selectProduct({ id: p.id, name: p.name, priceLabel: p.priceLabel })}
          >
            Focus the {p.name}
          </button>
        ))}
      </nav>

      {/* Focus card — the "commit" state */}
      <div className="controls controls--left">
        <AnimatePresence>
          {focused && selectedProduct && (
            <motion.div
              key={selectedProduct.id}
              className="focus-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.42, ease: EASE.cinematic }}
            >
              <p className="focus-card__name">{selectedProduct.name}</p>
              <p className="focus-card__price">
                {selectedProduct.priceLabel}
                {inCart && <span className="focus-card__inbag"> · in your bag</span>}
              </p>
              {product?.tagline && <p className="focus-card__tagline">{product.tagline}</p>}
              <div className="focus-card__actions">
                <button
                  type="button"
                  className="action-btn action-btn--accent"
                  onClick={() => addToCart(selectedProduct)}
                >
                  {inCart ? "Add another" : "Add to Bag"}
                </button>
                <button type="button" className="ghost-btn" onClick={() => setMicActive(true)}>
                  Ask Aurelis
                </button>
              </div>
              <button type="button" className="focus-card__back" onClick={clearSelectedProduct}>
                ← Collection
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
