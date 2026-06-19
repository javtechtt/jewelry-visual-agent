import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler disabled: React Three Fiber uses a custom reconciler and
  // mutates refs inside useFrame; we opt out of auto-memoization to keep the
  // render loop behavior predictable.
  reactCompiler: false,
};

export default nextConfig;
