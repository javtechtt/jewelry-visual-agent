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
    if (prevFlow.current !== "checkout" && demoFlow === "checkout" && pathname !== "/checkout") {
      // Opening checkout (button or agent tool) → go to the page.
      router.push("/checkout");
    } else if (prevFlow.current === "checkout" && !demoFlow && pathname === "/checkout") {
      // Checkout closed while still ON the page — e.g. the agent taking the guest
      // back to the boutique — so return home. (When a button already navigated,
      // pathname is no longer /checkout, so this won't double-fire or bounce.)
      router.push("/");
    }
    prevFlow.current = demoFlow;
  }, [demoFlow, pathname, router]);

  return null;
}
