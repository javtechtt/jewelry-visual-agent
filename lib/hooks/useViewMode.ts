"use client";

// Reactive view-mode hook: returns "desktop" | "landscape" | "portrait" and
// updates on resize + orientation change. SSR-safe (defaults to "desktop"), and
// because the experience is mounted client-only the initial value is already
// correct on first paint — no desktop→mobile flash. rAF-coalesced so rapid
// resize/rotate events don't thrash React.

import { useEffect, useState } from "react";
import { getViewMode, type ViewMode } from "@/config/responsive";

function readViewMode(): ViewMode {
  if (typeof window === "undefined") return "desktop";
  return getViewMode(window.innerWidth, window.innerHeight);
}

export function useViewMode(): ViewMode {
  const [view, setView] = useState<ViewMode>(readViewMode);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setView(readViewMode()));
    };
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return view;
}
