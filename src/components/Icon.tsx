/** Line icons for the app chrome. Emoji were replaced because they render
    differently on every device and can't take the theme's colour. */

type IconProps = { className?: string };

const BASE = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-5.5h5V20" />
    </svg>
  );
}

export function ModulesIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a1.8 1.8 0 0 0-1.8-1.5H4Z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a1.8 1.8 0 0 1 1.8-1.5H20Z" />
    </svg>
  );
}

export function QuizzesIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <path d="M5 4.5h9.5L19 9v10.5H5Z" />
      <path d="M14 4.5V9h5" />
      <path d="M8.5 13h7" />
      <path d="M8.5 16.5h4.5" />
    </svg>
  );
}

export function ResultsIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <path d="M4 20h16" />
      <path d="M7 20v-6" />
      <path d="M12 20V6" />
      <path d="M17 20v-9" />
    </svg>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </svg>
  );
}
