"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Week" },
  { href: "/standings", label: "Season Standings" },
  { href: "/bracket", label: "Playoff Bracket" },
];

export function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-divider px-4 py-4 font-sans sm:px-6">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`text-sm font-semibold tracking-tight transition-colors ${
              active
                ? "border-b-2 border-accent pb-1 text-accent"
                : "pb-1 text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
