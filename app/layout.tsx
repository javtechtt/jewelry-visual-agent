import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import "./globals.css";
import GlobalChrome from "@/components/GlobalChrome";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Editorial serif for the brand + scene display type.
const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aurelis.example.com";
const DESCRIPTION =
  "A cinematic, voice-first AI luxury boutique. Explore watches, jewelry, bags, fragrances and accessories, guided by the Aurelis concierge.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Aurelis · AI Luxury Boutique", template: "%s · Aurelis" },
  description: DESCRIPTION,
  applicationName: "Aurelis",
  keywords: ["luxury boutique", "AI concierge", "voice shopping", "watches", "jewelry", "bags", "fragrances", "3D boutique"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Aurelis",
    title: "Aurelis · AI Luxury Boutique",
    description: DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Aurelis · AI Luxury Boutique",
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f6efe4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Full-bleed under the notch so the cinematic canvas fills the screen; the DOM
  // overlay layer respects env(safe-area-inset-*). No effect on desktop.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${cormorant.variable} antialiased`}
    >
      <body>
        {/* No-JS / crawler fallback (the experience itself is client-only WebGL). */}
        <noscript>
          <div className="scene-fallback">
            <h1 className="scene-fallback__brand">AURELIS</h1>
            <p className="scene-fallback__msg">
              Aurelis is a voice-first 3D luxury boutique — watches, jewelry, bags,
              fragrances and accessories, guided by an AI concierge. Please enable
              JavaScript to explore the experience.
            </p>
          </div>
        </noscript>
        {children}
        {/* Persists across routes: voice agent, mic, brand, checkout navigator. */}
        <GlobalChrome />
      </body>
    </html>
  );
}
