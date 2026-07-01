"use client";

// Root error boundary — replaces the whole document (incl. the layout) if the
// layout itself throws, so it must render its own <html>/<body> and styles.

import { useEffect } from "react";
import { reportError } from "@/lib/log";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError("global-error", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="scene-fallback">
          <p className="scene-fallback__brand">AURELIS</p>
          <p className="scene-fallback__msg">We hit an unexpected snag.</p>
          <button type="button" className="action-btn action-btn--accent" onClick={() => reset()}>
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
