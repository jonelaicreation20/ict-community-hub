"use client";

import { useEffect } from "react";

/** Registers the worker that makes a cold start work with no signal. */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Registration fails on http:// origins other than localhost. The app
      // still works, just without offline support.
    });
  }, []);

  return null;
}
