"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, ModulesIcon, QuizzesIcon, ResultsIcon } from "@/components/Icon";

const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/modules", label: "Modules", Icon: ModulesIcon },
  { href: "/quizzes", label: "Quizzes", Icon: QuizzesIcon },
  { href: "/results", label: "Results", Icon: ResultsIcon },
] as const;

export function TabBar() {
  const pathname = usePathname();

  // A quiz in progress hides the tab bar: leaving mid-attempt should be a
  // deliberate act, not a stray thumb on the wrong tab.
  if (pathname.startsWith("/assess/")) return null;

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
