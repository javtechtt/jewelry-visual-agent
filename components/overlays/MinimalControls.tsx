"use client";

// Minimal luxury controls — the click/touch/keyboard layer over the voice-led
// flow. When a piece is focused it becomes a glass "focus card" (name · price ·
// tagline + Add to Bag · Ask Aurelis · ← Collection). Also hosts the keyboard
// navigation and screen-reader-reachable buttons for the 3D pieces (meshes
// aren't focusable). Checkout sits bottom-right. Nothing here is a card grid.

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DUO_PAGE_COUNT, useExperienceStore } from "@/lib/stores/useExperienceStore";
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
  const duoPage = useExperienceStore((s) => s.duoPage);
  const setDuoPage = useExperienceStore((s) => s.setDuoPage);
  const nextDuoPage = useExperienceStore((s) => s.nextDuoPage);

  const canCheckout = cart.length > 0 || selectedProduct !== null;
  const focused = selectedProduct !== null && !demoFlow;
  // The two-up selector pager shows on the arc views at rest (not while a piece
  // is focused, not in checkout, and not on the portrait swipe carousel).
  const showPager = !focused && !demoFlow && view !== "portrait";
  const product = selectedProduct ? PRODUCT_MAP[selectedProduct.id] : undefined;
  const inCart = selectedProduct ? cart.some((c) => c.id === selectedProduct.id) : false;

  // Keyboard (arc views only): while focused, Esc exits and ← / → move between
  // pieces; at rest, ← / → turn the pages of the two-up selector.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (demoFlow || view === "portrait") return;
      const isArrow = e.key === "ArrowRight" || e.key === "ArrowLeft";
      if (selectedProduct) {
        if (e.key === "Escape") {
          e.preventDefault();
          clearSelectedProduct();
        } else if (isArrow) {
          e.preventDefault();
          focusNextProduct(e.key === "ArrowRight" ? 1 : -1);
        }
      } else if (isArrow) {
        e.preventDefault();
        nextDuoPage(e.key === "ArrowRight" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedProduct, demoFlow, view, clearSelectedProduct, focusNextProduct, nextDuoPage]);

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

      {/* Bottom-centre: the two-up selector pager (‹ · · · ›) */}
      <AnimatePresence>
        {showPager && DUO_PAGE_COUNT > 1 && (
          <motion.div
            className="duo-pager"
            // x:"-50%" must live in the motion transform, not just CSS: framer's
            // animated `y` writes an inline transform that would otherwise drop
            // the CSS translateX(-50%) and shove the pill off-centre.
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 10, x: "-50%" }}
            transition={{ duration: 0.36, ease: EASE.cinematic }}
            role="group"
            aria-label="Browse the collection"
          >
            <button
              type="button"
              className="duo-pager__arrow"
              aria-label="Previous pieces"
              onClick={() => nextDuoPage(-1)}
              disabled={duoPage <= 0}
            >
              ‹
            </button>
            <div className="duo-pager__dots">
              {Array.from({ length: DUO_PAGE_COUNT }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Pieces ${i * 2 + 1}–${i * 2 + 2}`}
                  aria-current={i === duoPage}
                  className={`duo-pager__dot${i === duoPage ? " duo-pager__dot--on" : ""}`}
                  onClick={() => setDuoPage(i)}
                />
              ))}
            </div>
            <button
              type="button"
              className="duo-pager__arrow"
              aria-label="Next pieces"
              onClick={() => nextDuoPage(1)}
              disabled={duoPage >= DUO_PAGE_COUNT - 1}
            >
              ›
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
