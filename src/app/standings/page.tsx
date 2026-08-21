import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { formatRecord } from "@/lib/all-play/format";
import { getSeasonStandingsWithTrend } from "@/lib/all-play/season";
import { getLeagueDbId } from "@/lib/all-play/week";

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

export default async function Standings() {
  const leagueId = Number(process.env.LEAGUE_ID);
  const season = Number(process.env.SEASON);

  const leagueDbId =
    leagueId && season ? await getLeagueDbId(leagueId, season) : null;

  const standings = leagueDbId
    ? await getSeasonStandingsWithTrend(leagueDbId)
    : null;

  return (
    <div className="flex flex-1 flex-col gap-6 bg-background px-6 py-8 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Season Standings
        </h1>
        <FreshnessIndicator />
      </div>

      {standings && standings.length > 0 ? (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
              <th className="py-2 font-semibold">Rank</th>
              <th className="py-2 font-semibold">Team</th>
              <th className="py-2 text-right font-semibold">Record</th>
              <th className="py-2 text-right font-semibold">Win%</th>
              <th className="py-2 text-right font-semibold">Points</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team) => (
              <tr key={team.teamId} className="border-b border-divider">
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
                  <span className="font-semibold text-foreground">{team.teamName}</span>
                  <span className="ml-2 text-xs text-muted">{team.abbrev}</span>
                </td>
                <td className="py-3 text-right font-mono tabular-nums text-foreground">
                  {formatRecord(team.wins, team.losses, team.ties)}
                </td>
                <td className="py-3 text-right font-mono tabular-nums text-foreground">
                  {team.winPct.toFixed(3)}
                </td>
                <td className="py-3 text-right font-mono tabular-nums font-bold text-foreground">
                  {team.totalPoints.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-lg text-muted">
          No data yet — hang tight while the first refresh pulls scores in.
        </p>
      )}
    </div>
  );
}
