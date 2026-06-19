"use client";

// A luminous light-bloom wipe that fires on scene change, layered over the
// canvas. Combined with the camera dolly in SceneCamera, this sells the
// category -> atelier transition as cinematic rather than a navigation.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";
import { EASE } from "@/config/motion";

export default function SceneTransition() {
  const scene = useExperienceStore((s) => s.scene);
  const [flashing, setFlashing] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setFlashing(true);
    const id = setTimeout(() => setFlashing(false), 950);
    return () => clearTimeout(id);
  }, [scene]);

  return (
    <AnimatePresence>
      {flashing && (
        <motion.div
          key="scene-flash"
          className="scene-flash"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.95, ease: EASE.cinematic, times: [0, 0.4, 1] }}
        />
      )}
    </AnimatePresence>
  );
}
