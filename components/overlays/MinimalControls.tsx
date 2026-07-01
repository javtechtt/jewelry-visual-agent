"use client";

// Minimal luxury controls — the click/touch fallback for everything that is
// also voice-driven. Category chips (top), context + action clusters (bottom).
// Config-driven from categories.ts; nothing here is a card grid.

import { motion } from "framer-motion";
import { CATEGORIES } from "@/config/categories";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";

export default function MinimalControls() {
  const scene = useExperienceStore((s) => s.scene);
  const activeCategory = useExperienceStore((s) => s.activeCategory);
  const enterCategory = useExperienceStore((s) => s.enterCategory);
  const backToBoutique = useExperienceStore((s) => s.backToBoutique);
  const openDemoFlow = useExperienceStore((s) => s.openDemoFlow);
  const cart = useExperienceStore((s) => s.cart);
  const selectedProduct = useExperienceStore((s) => s.selectedProduct);

  const inAtelier = scene === "luminous-atelier";
  // Checkout needs something to buy — guard the empty-bag, nothing-selected case.
  const canCheckout = cart.length > 0 || selectedProduct !== null;

  return (
    <>
      {/* Top-center category rail */}
      <motion.nav
        className="category-rail"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        aria-label="Boutique categories"
      >
        {CATEGORIES.map((category) => (
          <button
            type="button"
            key={category.id}
            className={`chip${activeCategory === category.id ? " chip--active" : ""}`}
            onClick={() => enterCategory(category.id)}
            style={{ "--chip-glow": category.accent.glow } as React.CSSProperties}
          >
            {category.label}
          </button>
        ))}
      </motion.nav>

      {/* Bottom-left context cluster */}
      <div className="controls controls--left">
        {inAtelier && (
          <button type="button" className="ghost-btn" onClick={backToBoutique}>
            ← Boutique
          </button>
        )}
      </div>

      {/* Bottom-right action cluster (demo-safe) */}
      <div className="controls controls--right">
        <button type="button" className="action-btn" onClick={() => openDemoFlow("booking")}>
          Book
        </button>
        <button
          type="button"
          className="action-btn"
          onClick={() => openDemoFlow("checkout")}
          disabled={!canCheckout}
        >
          Checkout
        </button>
        <button type="button" className="action-btn" onClick={() => openDemoFlow("lead")}>
          Stay in Touch
        </button>
        <button type="button" className="action-btn action-btn--accent" onClick={() => openDemoFlow("handoff")}>
          Concierge
        </button>
      </div>
    </>
  );
}
