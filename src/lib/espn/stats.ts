// ESPN stat IDs (verified against 2025 box scores).
const STAT = {
  passAttempts: 0,
  passCompletions: 1,
  passYards: 3,
  passTouchdowns: 4,
  passInterceptions: 20,
  rushAttempts: 23,
  rushYards: 24,
  rushTouchdowns: 25,
  receivingYards: 42,
  receivingTouchdowns: 43,
  receptions: 53,
  targets: 58,
  fumblesLost: 72,
  fieldGoalsMade: 83,
  fieldGoalsAttempted: 84,
  extraPointsMade: 86,
  extraPointsAttempted: 87,
  defInterceptions: 95,
  defFumblesRecovered: 96,
  defSacks: 99,
  defTouchdowns: 105,
  defPointsAllowed: 120,
} as const;

function formatCount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/**
 * Compact, human-readable stat line for a player's week, e.g.
 * "RUSH 14 CAR, 67 YD · REC 5/7, 42 YD, 1 TD". Returns "" when the player
 * has no recorded stats yet (e.g. their game hasn't started).
 */
export function formatStatLine(position: string, stats: Record<string, number>): string {
  const get = (id: number) => stats[id] ?? 0;
  const withOptional = (base: string[], parts: [number, string][]) =>
    base
      .concat(parts.filter(([value]) => value > 0).map(([value, label]) => `${formatCount(value)} ${label}`))
      .join(", ");

  if (position === "D/ST") {
    if (!(STAT.defPointsAllowed in stats)) return "";
    const counted = withOptional([], [
      [get(STAT.defSacks), "SACK"],
      [get(STAT.defInterceptions), "INT"],
      [get(STAT.defFumblesRecovered), "FR"],
      [get(STAT.defTouchdowns), "TD"],
    ]);
    const pointsAllowed = `${get(STAT.defPointsAllowed)} PA`;
    return counted ? `${counted}, ${pointsAllowed}` : pointsAllowed;
  }

  if (position === "K") {
    const groups: string[] = [];
    if (get(STAT.fieldGoalsAttempted) > 0) {
      groups.push(`FG ${get(STAT.fieldGoalsMade)}/${get(STAT.fieldGoalsAttempted)}`);
    }
    if (get(STAT.extraPointsAttempted) > 0) {
      groups.push(`XP ${get(STAT.extraPointsMade)}/${get(STAT.extraPointsAttempted)}`);
    }
    return groups.join(" · ");
  }

  const groups: string[] = [];
  if (get(STAT.passAttempts) > 0) {
    groups.push(
      "PASS " +
        withOptional(
          [`${get(STAT.passCompletions)}/${get(STAT.passAttempts)}`, `${get(STAT.passYards)} YD`],
          [
            [get(STAT.passTouchdowns), "TD"],
            [get(STAT.passInterceptions), "INT"],
          ],
        ),
    );
  }
  if (get(STAT.rushAttempts) > 0) {
    groups.push(
      "RUSH " +
        withOptional(
          [`${get(STAT.rushAttempts)} CAR`, `${get(STAT.rushYards)} YD`],
          [[get(STAT.rushTouchdowns), "TD"]],
        ),
    );
  }
  if (get(STAT.targets) > 0 || get(STAT.receptions) > 0) {
    groups.push(
      "REC " +
        withOptional(
          [`${get(STAT.receptions)}/${get(STAT.targets)}`, `${get(STAT.receivingYards)} YD`],
          [[get(STAT.receivingTouchdowns), "TD"]],
        ),
    );
  }
  if (get(STAT.fumblesLost) > 0) {
    groups.push(`${get(STAT.fumblesLost)} FUM`);
  }
  return groups.join(" · ");
}
