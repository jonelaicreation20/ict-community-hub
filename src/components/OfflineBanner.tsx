"use client";

import { useOnline } from "@/lib/offline";

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;

  return (
    <div className="offline-banner" role="status">
      <span aria-hidden="true">⚑</span>
      <span>No connection — your answers are saved on this phone.</span>
    </div>
  );
}
