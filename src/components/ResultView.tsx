"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LETTERS, type Assessment } from "@/lib/questions";
import type { Attempt } from "@/lib/storage";

const CIRCUMFERENCE = 2 * Math.PI * 57;

export function ResultView({ assessment, attempt }: { assessment: Assessment; attempt: Attempt }) {
  const percent = Math.round((attempt.score / attempt.total) * 100);
  const [drawn, setDrawn] = useState(0);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setDrawn(percent));
    return () => window.cancelAnimationFrame(id);
  }, [percent]);

  const tone = percent >= 75 ? "var(--good)" : percent >= 50 ? "var(--gold)" : "var(--bad)";
  const verdict = attempt.timedOut ? "Time's up" : percent >= 75 ? "Well done!" : percent >= 50 ? "Good try" : "Keep going";

  return (
    <>
      <div className="result-hero">
        <div className="ring">
          <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true">
            <circle cx="66" cy="66" r="57" fill="none" stroke="var(--card-sunk)" strokeWidth="11" />
            <circle
              cx="66"
              cy="66"
              r="57"
              fill="none"
              stroke={tone}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE - (CIRCUMFERENCE * drawn) / 100}
              style={{ transition: "stroke-dashoffset .7s ease" }}
            />
          </svg>
          <div className="ring-mid">
            <b>
              {attempt.score}/{attempt.total}
            </b>
            <span>{percent}%</span>
          </div>
        </div>

        <h1 className="verdict">{verdict}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {assessment.name}
        </p>
        <span className={`pill ${attempt.syncState === "synced" ? "saved" : "pending"}`}>
          {attempt.syncState === "synced" ? "✓ Saved on this phone" : "⏳ Saved — will send when you get signal"}
        </span>
      </div>

      <div className="pad">
        <div className="eyebrow">Answer review</div>

        {assessment.questions.map((q, i) => {
          const given = attempt.answers[i];
          const correct = given === q.answerIndex;
          return (
            <div key={q.id} className="review-item">
              <span className={`rv-mark ${correct ? "ok" : "no"}`} aria-hidden="true">
                {correct ? "✓" : "✕"}
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4, display: "block" }}>
                  {i + 1}. {q.text}
                </span>
                <span className="muted" style={{ display: "block", marginTop: 3, fontSize: 11.5 }}>
                  {correct ? (
                    <>
                      You answered <b>{LETTERS[q.answerIndex]}</b> — {q.options[q.answerIndex]}
                    </>
                  ) : (
                    <>
                      You answered {given === null ? "nothing" : LETTERS[given]} · correct is{" "}
                      <b style={{ color: "var(--good)" }}>{LETTERS[q.answerIndex]}</b> — {q.options[q.answerIndex]}
                    </>
                  )}
                </span>
              </span>
            </div>
          );
        })}

        <Link href="/quizzes" className="btn wide">
          Back to quizzes
        </Link>
        <Link href="/results" className="btn ghost wide">
          See all my results
        </Link>
      </div>
    </>
  );
}
