"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/modules", label: "Modules", icon: "📗" },
  { href: "/quizzes", label: "Quizzes", icon: "✎" },
  { href: "/results", label: "Results", icon: "📊" },
] as const;

export function TabBar() {
  const pathname = usePathname();

  // A quiz in progress hides the tab bar: leaving mid-attempt should be a
  // deliberate act, not a stray thumb on the wrong tab.
  if (pathname.startsWith("/assess/")) return null;

  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={`tab${active ? " on" : ""}`} aria-current={active ? "page" : undefined}>
            <i aria-hidden="true">{t.icon}</i>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
