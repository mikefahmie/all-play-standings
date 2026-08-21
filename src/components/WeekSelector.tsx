"use client";

import { useRouter } from "next/navigation";

interface WeekSelectorProps {
  availableWeeks: number[];
  selectedWeek: number;
}

export function WeekSelector({ availableWeeks, selectedWeek }: WeekSelectorProps) {
  const router = useRouter();

  return (
    <select
      value={selectedWeek}
      onChange={(e) => router.push(`/?w=${e.target.value}`)}
      className="rounded border border-divider bg-surface px-3 py-1.5 text-sm font-semibold text-foreground"
      aria-label="Select week"
    >
      {availableWeeks.map((week) => (
        <option key={week} value={week}>
          Week {week}
        </option>
      ))}
    </select>
  );
}
