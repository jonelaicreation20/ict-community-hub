import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static: no Node server to run, deployable to any static host.
  output: "export",
  // next/image optimization needs a server, which a static export does not have.
  images: { unoptimized: true },
  // Emit /modules/index.html rather than /modules.html so plain file servers
  // (and GitHub Pages) resolve nested routes without extra rewrite rules.
  trailingSlash: true,
};

export default nextConfig;
