interface ScoreRowLike {
  week: number;
  is_completed: boolean;
}

/**
 * Resolves the league's current week and filters score rows down to the
 * ones relevant for display: completed weeks, plus the in-progress current
 * week (if any rows for it exist yet).
 *
 * Falls back to (highest completed week + 1) when `leagues.current_week` is
 * null — this should only happen for a league row that hasn't finished its
 * first ingestion yet.
 */
export function resolveRelevantScores<T extends ScoreRowLike>(
  currentWeekFromLeague: number | null | undefined,
  allScores: T[],
): { currentWeek: number; scores: T[] } {
  const highestCompletedWeek = allScores.reduce(
    (max, row) => (row.is_completed ? Math.max(max, row.week) : max),
    0,
  );

  const currentWeek = currentWeekFromLeague ?? highestCompletedWeek + 1;

  const scores = allScores.filter(
    (row) => row.is_completed || row.week === currentWeek,
  );

  return { currentWeek, scores };
}
