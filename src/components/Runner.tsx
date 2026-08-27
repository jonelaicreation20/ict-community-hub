"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LETTERS, formatClock, type Assessment } from "@/lib/questions";
import {
  clearSession,
  readSession,
  saveAttempt,
  writeSession,
  type Attempt,
  type Session,
} from "@/lib/storage";
import { useOnline } from "@/lib/offline";
import { ResultView } from "@/components/ResultView";
import { sendAttempt } from "@/lib/sheet-sync";

type Phase = "loading" | "intro" | "running" | "done";

export function Runner({ assessment }: { assessment: Assessment }) {
  const router = useRouter();
  const online = useOnline();

  const [phase, setPhase] = useState<Phase>("loading");
  const [answers, setAnswers] = useState<(number | null)[]>(() => new Array(assessment.questions.length).fill(null));
  const [index, setIndex] = useState(0);
  const [deadline, setDeadline] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [remaining, setRemaining] = useState(assessment.timeLimitSeconds);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const submitting = useRef(false);

  /* Resume an attempt that was interrupted by a reload, a locked phone, or a
     closed tab. The deadline is absolute, so time keeps running while away. */
  useEffect(() => {
    let cancelled = false;
    void readSession()
      .then((s?: Session) => {
        if (cancelled) return;
        if (s && s.assessment === assessment.slug && s.deadline > Date.now()) {
          setAnswers(s.answers);
          setIndex(s.index);
          setDeadline(s.deadline);
          setStartedAt(s.startedAt);
          setPhase("running");
        } else {
          if (s) void clearSession();
          setPhase("intro");
        }
      })
      .catch(() => setPhase("intro"));
    return () => {
      cancelled = true;
    };
  }, [assessment.slug]);

  const submit = useCallback(
    async (timedOut: boolean, finalAnswers: (number | null)[]) => {
      if (submitting.current) return;
      submitting.current = true;

      const score = assessment.questions.reduce((sum, q, i) => sum + (finalAnswers[i] === q.answerIndex ? 1 : 0), 0);
      const record: Attempt = {
        id: `${assessment.slug}-${Date.now()}`,
        assessment: assessment.slug,
        name: assessment.name,
        score,
        total: assessment.questions.length,
        answers: finalAnswers,
        startedAt,
        submittedAt: Date.now(),
        timedOut,
        syncState: "pending",
      };

      await saveAttempt(record).catch(() => {});
      if (navigator.onLine) {
        const sent = await sendAttempt(record).catch(() => false);
        if (sent) {
          record.syncState = "synced";
          await saveAttempt(record).catch(() => {});
        }
      }
      await clearSession().catch(() => {});
      setAttempt(record);
      setPhase("done");
      submitting.current = false;
    },
    [assessment, startedAt],
  );

  /* Countdown. Derived from the stored deadline rather than counted down in
     state, so it stays correct across backgrounding. */
  useEffect(() => {
    if (phase !== "running") return;

    const tick = () => {
      const left = Math.round((deadline - Date.now()) / 1000);
      setRemaining(Math.max(0, left));
      if (left <= 0) void submit(true, answers);
    };

    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [phase, deadline, answers, submit]);

  /* Persist after every change so a crash costs at most the current tap. */
  useEffect(() => {
    if (phase !== "running") return;
    void writeSession({ assessment: assessment.slug, answers, index, startedAt, deadline }).catch(() => {});
  }, [phase, assessment.slug, answers, index, startedAt, deadline]);

  function start() {
    const now = Date.now();
    setStartedAt(now);
    setDeadline(now + assessment.timeLimitSeconds * 1000);
    setAnswers(new Array(assessment.questions.length).fill(null));
    setIndex(0);
    setPhase("running");
  }

  function choose(optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = optionIndex;
      return next;
    });
    if (index < assessment.questions.length - 1) {
      window.setTimeout(() => setIndex((i) => Math.min(i + 1, assessment.questions.length - 1)), 160);
    }
  }

  if (phase === "loading") {
    return <div className="empty">Loading…</div>;
  }

  if (phase === "done" && attempt) {
    return <ResultView assessment={assessment} attempt={attempt} />;
  }

  if (phase === "intro") {
    const minutes = Math.round(assessment.timeLimitSeconds / 60);
    return (
      <>
        <header className="appbar">
          <Link href="/quizzes" className="iconbtn" aria-label="Back to quizzes">
            ‹
          </Link>
          <div>
            <h1>{assessment.name}</h1>
            <div className="sub">{assessment.subtitle}</div>
          </div>
        </header>
        <div className="pad">
          <div className="card">
            <div className="eyebrow">Before you start</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.65 }}>
              <li>
                {assessment.questions.length} questions, {minutes} minutes.
              </li>
              <li>The timer keeps running if you close the app, so finish in one sitting.</li>
              <li>Your answers are saved on this phone — you do not need a connection.</li>
            </ul>
          </div>
          <button className="btn wide" onClick={start}>
            Start
          </button>
          {!online ? <p className="muted" style={{ textAlign: "center" }}>You are offline. That is fine — the quiz works anyway.</p> : null}
        </div>
      </>
    );
  }

  const question = assessment.questions[index];
  const answered = answers.filter((a) => a !== null).length;
  const isLast = index === assessment.questions.length - 1;

  return (
    <>
      <div className="runbar">
        <div className="row">
          <button
            className="iconbtn"
            aria-label="Leave quiz"
            onClick={() => {
              if (window.confirm("Leave the quiz? Your answers stay saved and the timer keeps running.")) {
                router.push("/quizzes");
              }
            }}
          >
            ‹
          </button>
          <span className="run-count">
            Question {index + 1} of {assessment.questions.length}
          </span>
          <span className={`timer${remaining <= 60 ? " low" : ""}`} role="timer" aria-live="off">
            {formatClock(remaining)}
          </span>
        </div>
        <div className="pips" aria-hidden="true">
          {assessment.questions.map((_, i) => (
            <i key={i} className={i === index ? "here" : answers[i] !== null ? "done" : ""} />
          ))}
        </div>
      </div>

      <div className="pad">
        {question.stimulus ? (
          <div className="stimulus">
            <span className="lab">Read this first</span>
            {question.stimulus}
          </div>
        ) : null}

        <p className="qtext">{question.text}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {question.options.map((option, i) => (
            <button key={i} className={`opt${answers[index] === i ? " picked" : ""}`} onClick={() => choose(i)}>
              <span className="opt-l">{LETTERS[i]}</span>
              <span>{option}</span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 9 }}>
          <button className="btn ghost" style={{ flex: 1 }} onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
            Back
          </button>
          {isLast ? (
            <button
              className="btn"
              style={{ flex: 1 }}
              onClick={() => {
                const missing = assessment.questions.length - answered;
                if (missing > 0 && !window.confirm(`${missing} question${missing === 1 ? "" : "s"} not answered. Submit anyway?`)) {
                  return;
                }
                void submit(false, answers);
              }}
            >
              Submit
            </button>
          ) : (
            <button className="btn" style={{ flex: 1 }} onClick={() => setIndex((i) => i + 1)}>
              Next
            </button>
          )}
        </div>
      </div>
    </>
  );
}
