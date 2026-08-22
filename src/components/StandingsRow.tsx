import { TeamLogo } from "@/components/TeamLogo";
import { formatPoints, formatRecord, formatWinPct } from "@/lib/all-play/format";
import type { SeasonStandingWithTrend } from "@/lib/all-play/season";

const TREND_ARROW = {
  up: "▲",
  down: "▼",
  flat: "—",
} as const;

const TREND_COLOR = {
  up: "text-positive",
  down: "text-error",
  flat: "text-muted",
} as const;

export function StandingsCard({
  team,
  isLastPlayoffSpot = false,
}: {
  team: SeasonStandingWithTrend;
  isLastPlayoffSpot?: boolean;
}) {
  return (
    <>
      <div className="flex items-center gap-3 rounded border border-divider bg-[image:var(--gradient-surface)] px-4 py-3">
        <span className="flex items-center gap-1.5">
          <span className="font-display text-2xl font-bold tabular-nums text-foreground">
            {team.rank}
          </span>
          {team.trend && (
            <span
              className={`text-sm ${TREND_COLOR[team.trend]}`}
              aria-label={`Trend: ${team.trend}`}
            >
              {TREND_ARROW[team.trend]}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-3">
            <TeamLogo logoUrl={team.logoUrl} abbrev={team.abbrev} />
            <span className="min-w-0">
              <span className="block truncate font-semibold text-foreground">
                {team.teamName}
              </span>
              <span className="text-xs text-muted">{team.abbrev}</span>
            </span>
          </span>
        </div>
        <div className="flex shrink-0 items-end gap-4">
          <div className="hidden flex-col items-end gap-0.5 sm:flex">
            <span className="text-[10px] uppercase tracking-wide text-muted">Win%</span>
            <span className="font-mono text-sm tabular-nums text-muted">
              {formatWinPct(team.winPct)}
            </span>
          </div>
          <div className="hidden flex-col items-end gap-0.5 sm:flex">
            <span className="text-[10px] uppercase tracking-wide text-muted">Points</span>
            <span className="font-mono text-sm tabular-nums text-muted">
              {formatPoints(team.totalPoints)}
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] uppercase tracking-wide text-muted">Record</span>
            <span className="font-display text-3xl font-bold tabular-nums text-foreground">
              {formatRecord(team.wins, team.losses, team.ties)}
            </span>
          </div>
        </div>
      </div>
      {isLastPlayoffSpot && (
        <div className="flex items-center gap-3" aria-hidden="true">
          <div className="h-0.5 flex-1 rounded bg-accent" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
            Playoff cutoff
          </span>
          <div className="h-0.5 flex-1 rounded bg-accent" />
        </div>
      )}
    </>
  );
}
