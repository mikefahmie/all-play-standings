import { DataOrError } from "@/components/DataOrError";
import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { PlayoffRounds } from "@/components/PlayoffRounds";
import { getPlayoffData } from "@/lib/all-play/playoffs";
import { resolveLastErrorIfEmpty, resolveLeagueDbId } from "@/lib/ingestion/page-data";

export default async function Playoffs() {
  const leagueDbId = await resolveLeagueDbId();

  const playoffData = leagueDbId ? await getPlayoffData(leagueDbId) : null;

  const lastError = await resolveLastErrorIfEmpty(!leagueDbId, leagueDbId);

  return (
    <div className="flex flex-1 flex-col gap-6 bg-background px-4 py-6 font-sans sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Playoffs</h1>
        <FreshnessIndicator />
      </div>

      <DataOrError hasData={!!leagueDbId} lastError={lastError}>
        {playoffData ? (
          <PlayoffRounds data={playoffData} />
        ) : (
          <p className="text-sm text-muted">Playoffs begin week 15.</p>
        )}
      </DataOrError>
    </div>
  );
}
