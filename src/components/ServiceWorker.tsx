"use client";

import { useEffect } from "react";

/** Registers the worker that makes a cold start work with no signal. */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // A cache-first worker hides CSS/JS edits during local development because
    // Turbopack reuses chunk URLs. Remove old workers and shell caches so the
    // registration screens always show the current design while testing.
    if (process.env.NODE_ENV === "development") {
      void navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister())),
      );
      if ("caches" in window) {
        void caches.keys().then((names) =>
          Promise.all(names.filter((name) => name.startsWith("esmmap-shell-")).map((name) => caches.delete(name))),
        );
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Registration fails on http:// origins other than localhost. The app
      // still works, just without offline support.
    });
  }, []);

  return null;
}
