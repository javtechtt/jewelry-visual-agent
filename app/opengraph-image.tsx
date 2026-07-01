import { ImageResponse } from "next/og";

// Branded social-share card (Next auto-wires it to og:image + twitter:image).
export const alt = "Aurelis · AI Luxury Boutique";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fbf7f0, #efe6da)",
          color: "#3a2f1c",
        }}
      >
        <div style={{ fontSize: 128, letterSpacing: 26, fontWeight: 600 }}>AURELIS</div>
        <div style={{ fontSize: 32, letterSpacing: 10, marginTop: 20, color: "#7a6334" }}>
          MAISON · AI CONCIERGE
        </div>
      </div>
    ),
    { ...size },
  );
}
