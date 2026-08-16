import Link from "next/link";
import { MODULES } from "@/lib/modules";
import { ASSESSMENTS } from "@/lib/questions";
import { HomeStats } from "@/components/HomeStats";

export default function Home() {
  return (
    <>
      {/* The splash art already carries the E-SMMAp wordmark, so nothing is
          overlaid on it. The heading below is for screen readers and search. */}
      <div className="hero" role="img" aria-label="E-SMMAp — Electronic-Southenian Modular Mobile Application" />

      <div className="pad">
        <h1 className="sr-only" style={{ position: "absolute", left: "-9999px" }}>
          E-SMMAp — Electronic-Southenian Modular Mobile Application
        </h1>
        <p className="greet">
          Empowerment Technologies · <b>Quarter 1</b> · Pasay City South High School
        </p>

        <Link href="/modules" className="tile">
          <span className="tile-ico" aria-hidden="true">
            📗
          </span>
          <span>
            <span className="tile-t">Modules</span>
            <HomeStats kind="modules" total={MODULES.length} />
          </span>
          <span className="tile-go" aria-hidden="true">
            ›
          </span>
        </Link>

        <Link href="/quizzes" className="tile">
          <span className="tile-ico gold" aria-hidden="true">
            ✎
          </span>
          <span>
            <span className="tile-t">Quizzes</span>
            <span className="tile-d">Pre-test and {ASSESSMENTS.length - 1} module quizzes</span>
          </span>
          <span className="tile-go" aria-hidden="true">
            ›
          </span>
        </Link>

        <Link href="/results" className="tile">
          <span className="tile-ico sunk" aria-hidden="true">
            📊
          </span>
          <span>
            <span className="tile-t">My results</span>
            <HomeStats kind="results" total={0} />
          </span>
          <span className="tile-go" aria-hidden="true">
            ›
          </span>
        </Link>
      </div>
    </>
  );
}
