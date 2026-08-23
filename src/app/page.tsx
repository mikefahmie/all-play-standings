import { DataOrError } from "@/components/DataOrError";
import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { WeekCard } from "@/components/WeekRow";
import { WeekSelector } from "@/components/WeekSelector";
import { getWeekData } from "@/lib/all-play/week";
import { resolveLastErrorIfEmpty, resolveLeagueDbId } from "@/lib/ingestion/page-data";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const { w } = await searchParams;
  const requestedWeek = w ? Number(w) : undefined;

  const leagueDbId = await resolveLeagueDbId();

  const weekData = leagueDbId
    ? await getWeekData(leagueDbId, requestedWeek)
    : null;

  const lastError = await resolveLastErrorIfEmpty(!weekData, leagueDbId);

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
                <span className="flex items-center rounded bg-divider px-2 py-1 text-xs font-bold uppercase tracking-wide text-live shadow-[var(--shadow-glow-live)]">
                  <span
                    className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-live shadow-[var(--shadow-glow-live)]"
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

      <DataOrError hasData={!!weekData} lastError={lastError}>
        {weekData && (
          <div
            className={`mx-auto flex w-full max-w-2xl flex-col gap-2 ${
              weekData.isCompleted ? "opacity-90 saturate-75" : ""
            }`}
          >
            {weekData.results.map((team) => (
              <WeekCard
                key={`${team.teamId}-${weekData.week}`}
                team={team}
                week={weekData.week}
                isCurrentWeek={weekData.week === weekData.currentWeek}
              />
            ))}
          </div>
        )}
      </DataOrError>
    </div>
  );
}
