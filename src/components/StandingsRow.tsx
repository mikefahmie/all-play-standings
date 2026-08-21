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

export function StandingsRow({
  team,
  isLastPlayoffSpot = false,
}: {
  team: SeasonStandingWithTrend;
  isLastPlayoffSpot?: boolean;
}) {
  return (
    <>
      <tr
        className={
          isLastPlayoffSpot
            ? "border-b-2 border-accent"
            : "border-b border-divider"
        }
      >
        <td className="py-3">
          <span className="flex items-center gap-2">
            <span className="font-mono text-xl font-bold tabular-nums text-foreground">
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
        </td>
        <td className="py-3">
          <span className="flex items-center gap-3">
            <TeamLogo logoUrl={team.logoUrl} abbrev={team.abbrev} />
            <span>
              <span className="font-semibold text-foreground">{team.teamName}</span>
              <span className="ml-2 text-xs text-muted">{team.abbrev}</span>
            </span>
          </span>
        </td>
        <td className="py-3 text-right font-mono text-lg tabular-nums font-bold text-foreground">
          {formatRecord(team.wins, team.losses, team.ties)}
        </td>
        <td className="py-3 text-right font-mono text-sm tabular-nums text-muted">
          {formatWinPct(team.winPct)}
        </td>
        <td className="py-3 text-right font-mono text-sm tabular-nums text-muted">
          {formatPoints(team.totalPoints)}
        </td>
      </tr>
      {isLastPlayoffSpot && (
        <tr aria-hidden="true">
          <td colSpan={5} className="pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
              Playoff cutoff
            </span>
          </td>
        </tr>
      )}
    </>
  );
}

export function StandingsCard({
  team,
  isLastPlayoffSpot = false,
}: {
  team: SeasonStandingWithTrend;
  isLastPlayoffSpot?: boolean;
}) {
  return (
    <>
      <div className="flex items-center gap-3 rounded border border-divider bg-surface px-4 py-3">
        <TeamLogo logoUrl={team.logoUrl} abbrev={team.abbrev} />
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-xl font-bold tabular-nums text-foreground">
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
          <div className="truncate font-semibold text-foreground">{team.teamName}</div>
          <div className="text-xs text-muted">{team.abbrev}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-xl font-bold tabular-nums text-foreground">
            {formatRecord(team.wins, team.losses, team.ties)}
          </span>
          <span className="font-mono text-xs tabular-nums text-muted">
            {formatWinPct(team.winPct)} · {formatPoints(team.totalPoints)} pts
          </span>
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
