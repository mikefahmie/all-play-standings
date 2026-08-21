import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { WeekSelector } from "@/components/WeekSelector";
import { getLeagueDbId, getWeekData } from "@/lib/all-play/week";

function formatRecord(wins: number, losses: number, ties: number): string {
  return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const { w } = await searchParams;
  const requestedWeek = w ? Number(w) : undefined;

  const leagueId = Number(process.env.LEAGUE_ID);
  const season = Number(process.env.SEASON);

  const leagueDbId =
    leagueId && season ? await getLeagueDbId(leagueId, season) : null;

  const weekData = leagueDbId
    ? await getWeekData(leagueDbId, requestedWeek)
    : null;

  return (
    <div className="flex flex-1 flex-col gap-6 bg-background px-6 py-8 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {weekData ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Week {weekData.week}
              </h1>
              {!weekData.isCompleted && (
                <span className="flex items-center rounded bg-divider px-2 py-1 text-xs font-bold uppercase tracking-wide text-live">
                  <span
                    className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-live"
                    aria-hidden="true"
                  />
                  Live
                </span>
              )}
            </>
          ) : (
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              All-Play Standings
            </h1>
          )}
          {weekData && weekData.availableWeeks.length > 1 && (
            <WeekSelector
              availableWeeks={weekData.availableWeeks}
              selectedWeek={weekData.week}
            />
          )}
        </div>
        <FreshnessIndicator />
      </div>

      {weekData ? (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
              <th className="py-2 font-semibold">Team</th>
              <th className="py-2 text-right font-semibold">Record</th>
              <th className="py-2 text-right font-semibold">Score</th>
            </tr>
          </thead>
          <tbody>
            {weekData.results.map((team) => (
              <tr key={team.teamId} className="border-b border-divider">
                <td className="py-3">
                  <span className="font-semibold text-foreground">{team.teamName}</span>
                  <span className="ml-2 text-xs text-muted">{team.abbrev}</span>
                </td>
                <td className="py-3 text-right font-mono tabular-nums text-foreground">
                  {formatRecord(team.wins, team.losses, team.ties)}
                </td>
                <td className="py-3 text-right font-mono tabular-nums font-bold text-foreground">
                  {team.totalPoints.toFixed(2)}
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
