"use client";

import Link from "next/link";
import { useState } from "react";
import { MODULES, formatMB } from "@/lib/modules";
import { saveAllModules, useSavedModules, useOnline } from "@/lib/offline";

export function ModuleList() {
  const { saved, refresh } = useSavedModules();
  const online = useOnline();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const missing = MODULES.filter((m) => !saved.has(m.slug));
  const missingBytes = missing.reduce((sum, m) => sum + m.bytes, 0);

  async function handleSaveAll() {
    setBusy(true);
    await saveAllModules((done, total) => setProgress({ done, total }));
    await refresh();
    setBusy(false);
    setProgress(null);
  }

  const percent = Math.round(((MODULES.length - missing.length) / MODULES.length) * 100);

  return (
    <div className="pad">
      <div className="card">
        <div className="row">
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>Save all for offline</div>
            <div className="muted" style={{ marginTop: 2 }}>
              {missing.length === 0
                ? `All ${MODULES.length} modules saved on this phone`
                : progress
                  ? `Saving ${progress.done} of ${progress.total}…`
                  : `${missing.length} not saved · ${formatMB(missingBytes)}`}
            </div>
          </div>
          <button className="btn" onClick={handleSaveAll} disabled={busy || missing.length === 0 || !online}>
            {missing.length === 0 ? "All saved" : busy ? "Saving…" : !online ? "Needs signal" : "Save all"}
          </button>
        </div>
        <div className="bar">
          <i style={{ width: `${percent}%` }} />
        </div>
      </div>

      {MODULES.map((m) => {
        const isSaved = saved.has(m.slug);
        return (
          <Link key={m.slug} href={`/modules/${m.slug}`} className="mod">
            <span className="mod-code">{m.code}</span>
            <span style={{ minWidth: 0 }}>
              <span className="mod-t">{m.title}</span>
              <span className="mod-m">
                {isSaved ? (
                  <span className="chip saved">✓ Saved</span>
                ) : (
                  <span className="chip cloud">{formatMB(m.bytes)}</span>
                )}
                {m.quiz ? <span className="chip quiz">Has quiz</span> : null}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
