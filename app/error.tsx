"use client";

// Route-level error boundary: catches any throw inside the experience tree,
// reports it, and shows a branded recovery screen instead of white-screening.

import { useEffect } from "react";
import { reportError } from "@/lib/log";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError("route-error", error);
  }, [error]);

  return (
    <div className="scene-fallback">
      <p className="scene-fallback__brand">AURELIS</p>
      <p className="scene-fallback__msg">Something interrupted the experience.</p>
      <button type="button" className="action-btn action-btn--accent" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
