import { BracketView } from "@/components/BracketView";
import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { computeSeasonStandings } from "@/lib/all-play/season";
import { getLeagueDbId } from "@/lib/all-play/week";

export default async function Bracket() {
  const leagueId = Number(process.env.LEAGUE_ID);
  const season = Number(process.env.SEASON);

  const leagueDbId =
    leagueId && season ? await getLeagueDbId(leagueId, season) : null;

  const standings = leagueDbId ? await computeSeasonStandings(leagueDbId) : null;
  const seeds = standings && standings.length >= 6 ? standings.slice(0, 6) : null;

  return (
    <div className="flex flex-1 flex-col gap-6 bg-background px-4 py-6 font-sans sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Playoff Bracket
        </h1>
        <FreshnessIndicator />
      </div>

      {seeds ? (
        <BracketView seeds={seeds} />
      ) : (
        <p className="text-lg text-muted">
          No data yet — hang tight while the first refresh pulls scores in.
        </p>
      )}
    </div>
  );
}
