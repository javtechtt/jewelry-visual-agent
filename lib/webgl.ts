// Cheap WebGL availability probe so the experience can render a branded fallback
// instead of a blank canvas on machines where WebGL is unavailable, disabled, or
// the GPU is blocklisted (enterprise policies, headless, old hardware).

export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return true; // assume yes during SSR
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}
