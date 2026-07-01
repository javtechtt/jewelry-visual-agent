import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aurelis · AI Luxury Boutique",
    short_name: "Aurelis",
    description: "A voice-first 3D luxury boutique guided by an AI concierge.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6efe4",
    theme_color: "#f6efe4",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
