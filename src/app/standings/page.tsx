import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { StandingsCard } from "@/components/StandingsRow";
import { StandingsToggle } from "@/components/StandingsToggle";
import { getSeasonStandingsWithTrend } from "@/lib/all-play/season";
import { getLeagueDbId } from "@/lib/all-play/week";
import { readIngestionState } from "@/lib/ingestion/cooldown";
import { getSupabaseClient } from "@/lib/supabase/server";

const PLAYOFF_SPOTS = 6;

export default async function Standings({
  searchParams,
}: {
  searchParams: Promise<{ includeCurrent?: string }>;
}) {
  const { includeCurrent } = await searchParams;
  const includeCurrentWeek = includeCurrent !== "0";

  const leagueId = Number(process.env.LEAGUE_ID);
  const season = Number(process.env.SEASON);

  const leagueDbId =
    leagueId && season ? await getLeagueDbId(leagueId, season) : null;

  const seasonStandings = leagueDbId
    ? await getSeasonStandingsWithTrend(leagueDbId)
    : null;

  const standings =
    !includeCurrentWeek && seasonStandings?.standingsExcludingCurrentWeek
      ? seasonStandings.standingsExcludingCurrentWeek
      : (seasonStandings?.standings ?? null);

  const lastError =
    (!standings || standings.length === 0) && leagueDbId
      ? (await readIngestionState(getSupabaseClient(), leagueDbId)).lastError
      : null;

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

      {standings && standings.length > 0 ? (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
          {standings.map((team) => (
            <StandingsCard
              key={team.teamId}
              team={team}
              isLastPlayoffSpot={team.rank === PLAYOFF_SPOTS}
            />
          ))}
        </div>
      ) : lastError ? (
        <p className="text-lg text-error" role="alert">
          {lastError}
        </p>
      ) : (
        <p className="text-lg text-muted">
          No data yet — hang tight while the first refresh pulls scores in.
        </p>
      )}
    </div>
  );
}
