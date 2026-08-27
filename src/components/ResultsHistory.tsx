"use client";

import { useCallback, useEffect, useState } from "react";
import { useOnline } from "@/lib/offline";
import { allAttempts, clearAttempts, saveAttempt, toCSV, type Attempt } from "@/lib/storage";
import { hasSheetConnection, sendAttempt } from "@/lib/sheet-sync";

export function ResultsHistory() {
  const online = useOnline();
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);

  const load = useCallback(async () => {
    const rows = await allAttempts().catch(() => []);
    setAttempts(rows);
    return rows;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void allAttempts()
      .then((rows) => {
        if (!cancelled) setAttempts(rows);
      })
      .catch(() => {
        if (!cancelled) setAttempts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Anything finished offline is sent to the teacher sheet once connected. */
  useEffect(() => {
    if (!online) return;
    void (async () => {
      // Re-check at flush time: hydration can run this before the browser's
      // real connectivity is known.
      if (!navigator.onLine) return;
      const rows = await load();
      const pending = rows.filter((r) => r.syncState === "pending");
      if (!pending.length) return;
      for (const row of pending) {
        if (await sendAttempt(row).catch(() => false)) await saveAttempt({ ...row, syncState: "synced" });
      }
      void load();
    })();
  }, [online, load]);

  function exportCSV() {
    if (!attempts?.length) return;
    const blob = new Blob([toCSV(attempts)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `esmmap-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (attempts === null) return <div className="empty">Loading…</div>;

  if (!attempts.length) {
    return (
      <div className="empty">
        <span className="big" aria-hidden="true">
          📊
        </span>
        No attempts yet.
        <br />
        Your scores show up here after you finish a quiz.
      </div>
    );
  }

  return (
    <div className="pad">
      {attempts.map((a) => (
        <div key={a.id} className="hist">
          <span className="hist-s">
            {a.score}/{a.total}
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, display: "block" }}>{a.name}</span>
            <span className="muted" style={{ fontSize: 11 }}>
              {new Date(a.submittedAt).toLocaleString()}
              {a.timedOut ? " · ran out of time" : ""}
            </span>
          </span>
          <span style={{ marginLeft: "auto" }}>
            {a.syncState === "synced" ? (
              <span className="chip saved">✓ Sent</span>
            ) : hasSheetConnection() ? (
              <span className="chip quiz">⏳ Waiting</span>
            ) : (
              <span className="chip cloud">On device</span>
            )}
          </span>
        </div>
      ))}

      <button className="btn ghost wide" onClick={exportCSV}>
        Export my results (CSV)
      </button>
      <button
        className="btn ghost wide"
        onClick={async () => {
          if (window.confirm("Delete all your saved results? This cannot be undone.")) {
            await clearAttempts();
            void load();
          }
        }}
      >
        Clear my results
      </button>
    </div>
  );
}
