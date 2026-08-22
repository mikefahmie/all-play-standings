import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { StandingsCard } from "@/components/StandingsRow";
import { getSeasonStandingsWithTrend } from "@/lib/all-play/season";
import { getLeagueDbId } from "@/lib/all-play/week";

const PLAYOFF_SPOTS = 6;

export default async function Standings() {
  const leagueId = Number(process.env.LEAGUE_ID);
  const season = Number(process.env.SEASON);

  const leagueDbId =
    leagueId && season ? await getLeagueDbId(leagueId, season) : null;

  const standings = leagueDbId
    ? await getSeasonStandingsWithTrend(leagueDbId)
    : null;

  return (
    <div className="flex flex-1 flex-col gap-6 bg-background px-4 py-6 font-sans sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Season Standings
        </h1>
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
      ) : (
        <p className="text-lg text-muted">
          No data yet — hang tight while the first refresh pulls scores in.
        </p>
      )}
    </div>
  );
}
