"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ASSESSMENTS } from "@/lib/questions";
import { allAttempts, type Attempt } from "@/lib/storage";

export function QuizList() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    void allAttempts().then(setAttempts).catch(() => setAttempts([]));
  }, []);

  return (
    <div className="pad">
      {ASSESSMENTS.map((a) => {
        const mine = attempts.filter((x) => x.assessment === a.slug);
        const best = mine.length ? Math.max(...mine.map((x) => x.score)) : null;

        return (
          <div key={a.slug} className="card">
            <div className="row" style={{ alignItems: "flex-start" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{a.name}</h2>
                <div className="muted" style={{ marginTop: 2 }}>
                  {a.questions.length} questions · {Math.round(a.timeLimitSeconds / 60)} minutes
                </div>
              </div>
              {best !== null ? (
                <div style={{ textAlign: "right" }}>
                  <b style={{ fontSize: 19, fontVariantNumeric: "tabular-nums" }}>
                    {best}/{a.questions.length}
                  </b>
                  <span className="eyebrow" style={{ display: "block" }}>
                    Best
                  </span>
                </div>
              ) : null}
            </div>
            <Link href={`/assess/${a.slug}`} className="btn wide">
              {best !== null ? "Take again" : "Start"}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
