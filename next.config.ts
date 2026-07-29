import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // jsdom (used by the RSS ingestion route) must stay a Node.js require —
  // bundling it breaks its internal resource loading.
  serverExternalPackages: ["jsdom"],
  // A stray lockfile exists in the user profile directory; pin the workspace
  // root so Turbopack doesn't infer the wrong one.
  turbopack: { root: __dirname },
};

export default nextConfig;
