"use client";

import Link from "next/link";
import { MODULES, formatMB } from "@/lib/modules";
import { useSavedModules, useOnline } from "@/lib/offline";

export function ModuleList() {
  const { saved } = useSavedModules();
  const online = useOnline();

  const missing = MODULES.filter((m) => !saved.has(m.slug));

  const percent = Math.round(((MODULES.length - missing.length) / MODULES.length) * 100);

  return (
    <div className="pad">
      <div className="card">
        <div className="row">
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>Lessons saved automatically</div>
            <div className="muted" style={{ marginTop: 2 }}>
              {missing.length === 0
                ? `All ${MODULES.length} modules are ready inside the app`
                : online
                  ? `Preparing ${missing.length} ${missing.length === 1 ? "module" : "modules"} in the background…`
                  : `Connect once to prepare ${missing.length} more ${missing.length === 1 ? "module" : "modules"}`}
            </div>
          </div>
          <span className={`chip ${missing.length === 0 ? "saved" : "cloud"}`}>{missing.length === 0 ? "✓ Ready" : `${MODULES.length - missing.length}/${MODULES.length}`}</span>
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
