"use client";

// App-wide chrome that must live ABOVE the route so it persists across
// navigation (boutique <-> checkout): the voice agent stays connected and keeps
// filling checkout fields, the mic + brand remain present, and the checkout
// navigator watches the store. Route-specific things (the 3D scene, the cart,
// the boutique controls) stay in their own pages.

import CheckoutNavigator from "@/components/checkout/CheckoutNavigator";
import VoiceController from "@/components/voice/VoiceController";
import BrandOverlay from "@/components/overlays/BrandOverlay";
import MicButton from "@/components/voice/MicButton";
import VoiceStatusHint from "@/components/voice/VoiceStatusHint";
import TextFallback from "@/components/voice/TextFallback";

export default function GlobalChrome() {
  return (
    <>
      <CheckoutNavigator />
      <VoiceController />
      <BrandOverlay />
      <MicButton />
      <VoiceStatusHint />
      <TextFallback />
    </>
  );
}
