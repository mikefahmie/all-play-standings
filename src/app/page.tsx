import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { WeekCard, WeekRow } from "@/components/WeekRow";
import { WeekSelector } from "@/components/WeekSelector";
import { getLeagueDbId, getWeekData } from "@/lib/all-play/week";

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
    <div className="flex flex-1 flex-col gap-6 bg-background px-4 py-6 font-sans sm:px-6 sm:py-8">
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
        <>
          <table className="hidden w-full border-collapse text-left md:table">
            <thead>
              <tr className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                <th className="py-2 font-semibold">Team</th>
                <th className="py-2 text-right font-semibold">Record</th>
                <th className="py-2 text-right font-semibold">Score</th>
              </tr>
            </thead>
            <tbody>
              {weekData.results.map((team) => (
                <WeekRow key={team.teamId} team={team} />
              ))}
            </tbody>
          </table>
          <div className="flex flex-col gap-2 md:hidden">
            {weekData.results.map((team) => (
              <WeekCard key={team.teamId} team={team} />
            ))}
          </div>
        </>
      ) : (
        <p className="text-lg text-muted">
          No data yet — hang tight while the first refresh pulls scores in.
        </p>
      )}
    </div>
  );
}
