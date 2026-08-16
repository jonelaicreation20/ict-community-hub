"use client";

import { useSavedModules } from "@/lib/offline";

/** Offline-readiness strip that sits on the seam below the hero panel. */
export function HomeProgress({ total }: { total: number }) {
  const { saved, ready } = useSavedModules();
  const count = ready ? saved.size : 0;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="hero-strip">
      <div className="row">
        <span className="strip-label">Ready offline</span>
        <span className="strip-value">
          {count}/{total}
        </span>
      </div>
      <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Modules saved for offline use">
        <i style={{ width: `${pct}%` }} />
      </div>
      <p className="muted" style={{ margin: 0 }}>
        {count === 0
          ? "Save a module to read it without a connection."
          : `${count} ${count === 1 ? "module" : "modules"} will open with no signal.`}
      </p>
    </div>
  );
}
