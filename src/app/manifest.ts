import type { MetadataRoute } from "next";

// Metadata routes are dynamic by default; a static export needs this pinned.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "E-SMMAp — Electronic-Southenian Modular Mobile Application",
    short_name: "E-SMMAp",
    description:
      "Empowerment Technologies Quarter 1 modules and quizzes for Pasay City South High School. Works without a connection.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eef6f1",
    theme_color: "#1e6b52",
    categories: ["education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
