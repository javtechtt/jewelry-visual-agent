"use client";

// Bridges the store's `demoFlow` to real navigation. When checkout opens — from
// a button OR an agent tool call (start_checkout) — we route to the /checkout
// page instead of layering a modal over the boutique. Leaving the page (Return,
// Cancel, Back) is handled by CheckoutFlow's unmount, which clears demoFlow.

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useExperienceStore } from "@/lib/stores/useExperienceStore";

export default function CheckoutNavigator() {
  const demoFlow = useExperienceStore((s) => s.demoFlow);
  const router = useRouter();
  const pathname = usePathname();
  const prevFlow = useRef(demoFlow);

  useEffect(() => {
    // Fire only on the transition INTO checkout, so navigating away from the
    // page (which clears demoFlow) never bounces the guest back onto it.
    if (prevFlow.current !== "checkout" && demoFlow === "checkout" && pathname !== "/checkout") {
      router.push("/checkout");
    }
    prevFlow.current = demoFlow;
  }, [demoFlow, pathname, router]);

  return null;
}
