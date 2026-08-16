import Image from "next/image";
import Link from "next/link";
import { MODULES } from "@/lib/modules";
import { ASSESSMENTS } from "@/lib/questions";
import { HomeStats } from "@/components/HomeStats";
import { HomeProgress } from "@/components/HomeProgress";
import { ChevronIcon, ModulesIcon, QuizzesIcon, ResultsIcon } from "@/components/Icon";

export default function Home() {
  return (
    <>
      <header className="hero">
        <Image
          className="hero-photo"
          src="/assets/community-students-hero.jpg"
          alt="Filipino high school students working together on a laptop and tablet"
          fill
          priority
          sizes="(max-width: 520px) 100vw, 520px"
        />
        <div className="hero-shade" aria-hidden="true" />
        <span className="hero-orbit orbit-one" aria-hidden="true" />
        <span className="hero-orbit orbit-two" aria-hidden="true" />

        <div className="hero-copy">
          <p className="hero-eyebrow">
            <span aria-hidden="true" /> Empowerment Technologies
          </p>
          <h1 className="hero-title">Learn. Create. Connect.</h1>
          <p className="hero-sub">Your ICT lessons, challenges, and wins—together in one place.</p>
          <Link href="/modules" className="hero-cta">
            Start learning <ChevronIcon />
          </Link>
        </div>

        <div className="hero-sticker" aria-label="Quarter 1">
          <b>Q1</b>
          <span>Let&apos;s go!</span>
        </div>
      </header>

      <HomeProgress total={MODULES.length} />

      <section className="home-section" aria-labelledby="explore-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your learning space</p>
            <h2 id="explore-heading">What do you want to do?</h2>
          </div>
          <span className="section-spark" aria-hidden="true">✦</span>
        </div>

        <div className="home-actions">
          <Link href="/modules" className="tile tile-featured">
            <span className="tile-ico"><ModulesIcon /></span>
            <span className="tile-copy">
              <span className="tile-kicker">Explore &amp; learn</span>
              <span className="tile-t">Modules</span>
              <HomeStats kind="modules" total={MODULES.length} />
            </span>
            <span className="tile-go"><ChevronIcon /></span>
            <span className="tile-bubble" aria-hidden="true">01</span>
          </Link>

          <Link href="/quizzes" className="tile tile-quiz">
            <span className="tile-ico gold"><QuizzesIcon /></span>
            <span className="tile-copy">
              <span className="tile-kicker">Test your skills</span>
              <span className="tile-t">Quizzes</span>
              <span className="tile-d">Pre-test + {ASSESSMENTS.length - 1} challenges</span>
            </span>
            <span className="tile-go"><ChevronIcon /></span>
          </Link>

          <Link href="/results" className="tile tile-results">
            <span className="tile-ico sunk"><ResultsIcon /></span>
            <span className="tile-copy">
              <span className="tile-kicker">See your growth</span>
              <span className="tile-t">My results</span>
              <HomeStats kind="results" total={0} />
            </span>
            <span className="tile-go"><ChevronIcon /></span>
          </Link>
        </div>
      </section>

      <aside className="community-note">
        <span className="community-mark" aria-hidden="true">#</span>
        <div>
          <p className="community-title">Made for learning together</p>
          <p>Save lessons offline, compare ideas with classmates, and keep building your digital skills.</p>
        </div>
      </aside>
    </>
  );
}
