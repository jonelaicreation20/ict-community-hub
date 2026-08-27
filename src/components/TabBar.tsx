"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, ModulesIcon, QuizzesIcon, ResultsIcon } from "@/components/Icon";
import { PROFILE_EVENT, readProfile } from "@/lib/classroom";
import { useEffect, useState } from "react";

const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/modules", label: "Modules", Icon: ModulesIcon },
  { href: "/quizzes", label: "Quizzes", Icon: QuizzesIcon },
  { href: "/results", label: "Results", Icon: ResultsIcon },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const [student, setStudent] = useState(false);

  useEffect(() => {
    const refresh = () => setStudent(readProfile()?.role === "student");
    refresh();
    window.addEventListener(PROFILE_EVENT, refresh);
    return () => window.removeEventListener(PROFILE_EVENT, refresh);
  }, []);

  // A quiz in progress hides the tab bar: leaving mid-attempt should be a
  // deliberate act, not a stray thumb on the wrong tab.
  if (!student || pathname.startsWith("/assess/")) return null;

  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`tab${active ? " on" : ""}`} aria-current={active ? "page" : undefined}>
            <Icon />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
