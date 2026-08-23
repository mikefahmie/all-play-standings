import { getSupabaseClient } from "@/lib/supabase/server";
import { ingestAllWeeks, type IngestResult } from "./ingest";

const DEFAULT_COOLDOWN_MS = 3 * 60 * 1000;

function getCooldownMs(): number {
  const raw = process.env.INGESTION_COOLDOWN_MS;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_COOLDOWN_MS;
}

export type StalenessCheckResult =
  | {
      status: "ingested";
      cooldownMs: number;
      nextEligibleAt: string;
      ingestResult: IngestResult;
      lastIngestedAt: string | null;
      lastError: string | null;
    }
  | {
      status: "skipped-cooldown";
      cooldownMs: number;
      lastAttemptedAt: string;
      nextEligibleAt: string;
      cooldownRemainingMs: number;
      lastIngestedAt: string | null;
      lastError: string | null;
    }
  | {
      status: "error";
      message: string;
    };

interface LeagueRow {
  id: number;
}

interface IngestionStateRow {
  last_attempted_at: string | null;
  last_ingested_at: string | null;
  last_error: string | null;
}

export async function readIngestionState(
  supabase: ReturnType<typeof getSupabaseClient>,
  internalLeagueId: number,
): Promise<{ lastIngestedAt: string | null; lastError: string | null }> {
  const { data } = await supabase
    .from("ingestion_state")
    .select("last_ingested_at, last_error")
    .eq("league_id", internalLeagueId)
    .single<Pick<IngestionStateRow, "last_ingested_at" | "last_error">>();

  return {
    lastIngestedAt: data?.last_ingested_at ?? null,
    lastError: data?.last_error ?? null,
  };
}

export async function checkAndTriggerIngestion(
  leagueId: number,
  season: number,
): Promise<StalenessCheckResult> {
  const supabase = getSupabaseClient();
  const cooldownMs = getCooldownMs();

  const { data: league } = await supabase
    .from("leagues")
    .select("id")
    .eq("espn_league_id", leagueId)
    .eq("season", season)
    .single<LeagueRow>();

  if (!league) {
    const ingestResult = await ingestAllWeeks(leagueId, season);

    const { data: bootstrappedLeague } = await supabase
      .from("leagues")
      .select("id")
      .eq("espn_league_id", leagueId)
      .eq("season", season)
      .single<LeagueRow>();

    const { lastIngestedAt, lastError } = bootstrappedLeague
      ? await readIngestionState(supabase, bootstrappedLeague.id)
      : { lastIngestedAt: null, lastError: null };

    return {
      status: "ingested",
      cooldownMs,
      nextEligibleAt: new Date(Date.now() + cooldownMs).toISOString(),
      ingestResult,
      lastIngestedAt,
      lastError,
    };
  }

  const internalLeagueId = league.id;

  const { error: ensureError } = await supabase
    .from("ingestion_state")
    .upsert(
      { league_id: internalLeagueId },
      { onConflict: "league_id", ignoreDuplicates: true },
    );

  if (ensureError) {
    return { status: "error", message: ensureError.message };
  }

  const nowIso = new Date().toISOString();
  const cutoffIso = new Date(Date.now() - cooldownMs).toISOString();

  const { data: claimed, error: claimError } = await supabase
    .from("ingestion_state")
    .update({ last_attempted_at: nowIso })
    .eq("league_id", internalLeagueId)
    .or(`last_attempted_at.is.null,last_attempted_at.lt.${cutoffIso}`)
    .select("last_attempted_at");

  if (claimError) {
    return { status: "error", message: claimError.message };
  }

  if (claimed && claimed.length > 0) {
    const ingestResult = await ingestAllWeeks(leagueId, season);
    const { lastIngestedAt, lastError } = await readIngestionState(
      supabase,
      internalLeagueId,
    );
    return {
      status: "ingested",
      cooldownMs,
      nextEligibleAt: new Date(Date.now() + cooldownMs).toISOString(),
      ingestResult,
      lastIngestedAt,
      lastError,
    };
  }

  const { data: stateRow, error: readError } = await supabase
    .from("ingestion_state")
    .select("last_attempted_at, last_ingested_at, last_error")
    .eq("league_id", internalLeagueId)
    .single<IngestionStateRow>();

  if (readError || !stateRow || !stateRow.last_attempted_at) {
    return {
      status: "error",
      message: readError?.message ?? "Missing ingestion_state row",
    };
  }

  const lastAttemptedAt = stateRow.last_attempted_at;
  const remaining =
    cooldownMs - (Date.now() - new Date(lastAttemptedAt).getTime());

  return {
    status: "skipped-cooldown",
    cooldownMs,
    lastAttemptedAt,
    nextEligibleAt: new Date(
      new Date(lastAttemptedAt).getTime() + cooldownMs,
    ).toISOString(),
    cooldownRemainingMs: Math.max(0, remaining),
    lastIngestedAt: stateRow.last_ingested_at,
    lastError: stateRow.last_error,
  };
}
