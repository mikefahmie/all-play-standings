import { BracketView } from "@/components/BracketView";
import { DataOrError } from "@/components/DataOrError";
import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { computeSeasonStandings } from "@/lib/all-play/season";
import { resolveLastErrorIfEmpty, resolveLeagueDbId } from "@/lib/ingestion/page-data";

export default async function Bracket() {
  const leagueDbId = await resolveLeagueDbId();

  const standings = leagueDbId ? await computeSeasonStandings(leagueDbId) : null;
  const seeds = standings && standings.length >= 6 ? standings.slice(0, 6) : null;

  const lastError = await resolveLastErrorIfEmpty(!seeds, leagueDbId);

  return (
    <div className="flex flex-1 flex-col gap-6 bg-background px-4 py-6 font-sans sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Playoff Bracket
        </h1>
        <FreshnessIndicator />
      </div>

      <DataOrError hasData={!!seeds} lastError={lastError}>
        {seeds && <BracketView seeds={seeds} />}
      </DataOrError>
    </div>
  );
}
