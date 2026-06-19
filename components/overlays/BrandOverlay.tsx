"use client";

// Minimal brand mark, top-left. Typography does the work — no boxes, no clutter.

import { motion } from "framer-motion";

export default function BrandOverlay() {
  return (
    <motion.header
      className="brand"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
    >
      <span className="brand__mark">AURELIS</span>
      <span className="brand__tag">Maison · AI Concierge</span>
    </motion.header>
  );
}
