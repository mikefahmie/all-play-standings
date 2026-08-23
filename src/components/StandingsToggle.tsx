"use client";

import { useRouter } from "next/navigation";

interface StandingsToggleProps {
  currentWeek: number;
  includeCurrentWeek: boolean;
}

export function StandingsToggle({
  currentWeek,
  includeCurrentWeek,
}: StandingsToggleProps) {
  const router = useRouter();

  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-muted">
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          type="checkbox"
          checked={includeCurrentWeek}
          onChange={(e) =>
            router.push(`/standings?includeCurrent=${e.target.checked ? "1" : "0"}`)
          }
          className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer appearance-none"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-divider transition-colors peer-checked:bg-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform peer-checked:translate-x-5"
        />
      </span>
      <span className="select-none">
        Include Week {currentWeek} <span className="text-muted/80">(in progress)</span>
      </span>
    </label>
  );
}
