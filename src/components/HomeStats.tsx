"use client";

import { useEffect, useState } from "react";
import { useSavedModules } from "@/lib/offline";
import { allAttempts } from "@/lib/storage";

/** Live counts under the home tiles, read from the device. */
export function HomeStats({ kind, total }: { kind: "modules" | "results"; total: number }) {
  const { saved, ready } = useSavedModules();
  const [attempts, setAttempts] = useState<number | null>(null);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (kind !== "results") return;
    void allAttempts()
      .then((rows) => {
        setAttempts(rows.length);
        setPending(rows.filter((r) => r.syncState === "pending").length);
      })
      .catch(() => setAttempts(0));
  }, [kind]);

  if (kind === "modules") {
    return <span className="tile-d">{ready ? `${total} modules · ${saved.size} saved offline` : `${total} modules`}</span>;
  }

  if (attempts === null) return <span className="tile-d">Your scores</span>;
  if (attempts === 0) return <span className="tile-d">No attempts yet</span>;

  return (
    <span className="tile-d">
      {attempts} {attempts === 1 ? "attempt" : "attempts"}
      {pending > 0 ? ` · ${pending} waiting to send` : ""}
    </span>
  );
}
