import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray lockfile exists in the user profile directory; pin the workspace
  // root so Turbopack doesn't infer the wrong one.
  turbopack: { root: __dirname },
};

export default nextConfig;
