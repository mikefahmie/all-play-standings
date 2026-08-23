import { DataOrError } from "@/components/DataOrError";
import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { StandingsCard } from "@/components/StandingsRow";
import { StandingsToggle } from "@/components/StandingsToggle";
import { getSeasonStandingsWithTrend } from "@/lib/all-play/season";
import { resolveLastErrorIfEmpty, resolveLeagueDbId } from "@/lib/ingestion/page-data";

const PLAYOFF_SPOTS = 6;

export default async function Standings({
  searchParams,
}: {
  searchParams: Promise<{ includeCurrent?: string }>;
}) {
  const { includeCurrent } = await searchParams;
  const includeCurrentWeek = includeCurrent !== "0";

  const leagueDbId = await resolveLeagueDbId();

  const seasonStandings = leagueDbId
    ? await getSeasonStandingsWithTrend(leagueDbId)
    : null;

  // standingsExcludingCurrentWeek is null only when currentWeek === 1 (no
  // prior week to fall back to) — in that case there is nothing to exclude,
  // so showing the full standings is the correct behavior, not a fallback
  // that silently ignores the toggle.
  const standings = !includeCurrentWeek
    ? (seasonStandings?.standingsExcludingCurrentWeek ?? seasonStandings?.standings ?? null)
    : (seasonStandings?.standings ?? null);

  const lastError = await resolveLastErrorIfEmpty(
    !standings || standings.length === 0,
    leagueDbId,
  );

  return (
    <div className="flex flex-1 flex-col gap-6 bg-background px-4 py-6 font-sans sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Season Standings
          </h1>
          {seasonStandings && seasonStandings.currentWeek > 1 && (
            <StandingsToggle
              currentWeek={seasonStandings.currentWeek}
              includeCurrentWeek={includeCurrentWeek}
            />
          )}
        </div>
        <FreshnessIndicator />
      </div>

      <DataOrError hasData={!!standings && standings.length > 0} lastError={lastError}>
        {standings && (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
            {standings.map((team) => (
              <StandingsCard
                key={team.teamId}
                team={team}
                isLastPlayoffSpot={team.rank === PLAYOFF_SPOTS}
              />
            ))}
          </div>
        )}
      </DataOrError>
    </div>
  );
}
