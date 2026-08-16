"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMB, modulePath, type Module } from "@/lib/modules";
import { isSaved, saveModule, useOnline } from "@/lib/offline";

type State = "checking" | "ready" | "unavailable";

export function ModuleReader({ module }: { module: Module }) {
  const online = useOnline();
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cached = await isSaved(module);
      if (cancelled) return;
      if (cached) {
        setState("ready");
        return;
      }
      if (!navigator.onLine) {
        setState("unavailable");
        return;
      }
      // Opening a module online is what puts it on the device.
      const ok = await saveModule(module);
      if (!cancelled) setState(ok ? "ready" : "unavailable");
    })();

    return () => {
      cancelled = true;
    };
  }, [module, online]);

  if (state === "unavailable") {
    return (
      <div className="reader">
        <div className="notice">
          <b>Not saved for offline yet.</b>
          <br />
          Open this module once while you have a connection. After that it stays on your phone and opens with no signal.
        </div>
        <Link href="/modules" className="btn ghost wide">
          Back to modules
        </Link>
      </div>
    );
  }

  return (
    <div className="reader">
      <object className="pdf-frame" data={modulePath(module)} type="application/pdf" aria-label={module.title}>
        {/* Most mobile browsers will not render a PDF inline; they get this. */}
        <div className="notice" style={{ margin: 12 }}>
          Your browser cannot show the PDF here. Use the button below to open it.
        </div>
      </object>

      <a className="btn wide" href={modulePath(module)} target="_blank" rel="noopener noreferrer">
        Open PDF ({formatMB(module.bytes)})
      </a>

      {module.quiz ? (
        <Link href={`/assess/${module.quiz}`} className="btn ghost wide">
          Take the Module {module.code} quiz
        </Link>
      ) : null}

      <p className="muted" style={{ textAlign: "center", margin: 0 }}>
        {state === "ready" ? "Saved on this phone — opens without a connection." : "Loading…"}
      </p>
    </div>
  );
}
