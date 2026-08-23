import { getLeagueDbId } from "@/lib/all-play/week";
import { getSupabaseClient } from "@/lib/supabase/server";
import { readIngestionState } from "./cooldown";

export async function resolveLeagueDbId(): Promise<number | null> {
  const leagueId = Number(process.env.LEAGUE_ID);
  const season = Number(process.env.SEASON);

  return leagueId && season ? getLeagueDbId(leagueId, season) : null;
}

/**
 * When a page's primary data fetch comes back empty, look up the ingestion
 * error so the page can distinguish "no data yet" from "ingestion is
 * failing" — used identically by the week, standings, and bracket pages.
 */
export async function resolveLastErrorIfEmpty(
  isEmpty: boolean,
  leagueDbId: number | null,
): Promise<string | null> {
  if (!isEmpty || !leagueDbId) {
    return null;
  }

  const { lastError } = await readIngestionState(getSupabaseClient(), leagueDbId);
  return lastError;
}
