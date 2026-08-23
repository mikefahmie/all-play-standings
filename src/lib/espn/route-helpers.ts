import { NextResponse } from "next/server";

export interface ParsedLeagueWeekParams {
  leagueId: number;
  season: number;
  week: number;
}

/**
 * Resolves LEAGUE_ID/SEASON env vars (SEASON overridable via ?season=) and a
 * required ?week= query param, shared by the boxscore routes. Returns a
 * NextResponse to return immediately on validation failure.
 */
export function parseLeagueWeekParams(
  searchParams: URLSearchParams,
): ParsedLeagueWeekParams | NextResponse {
  const leagueId = Number(process.env.LEAGUE_ID);
  const seasonOverride = searchParams.get("season");
  const season = seasonOverride ? Number(seasonOverride) : Number(process.env.SEASON);

  if (!leagueId || !season) {
    return NextResponse.json(
      { status: "error", message: "Missing LEAGUE_ID or SEASON env vars." },
      { status: 500 },
    );
  }

  const weekParam = searchParams.get("week");
  const week = Number(weekParam);

  if (!weekParam || !Number.isInteger(week) || week < 1) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "Missing or invalid 'week' query param — expected a positive integer, e.g. ?week=1.",
      },
      { status: 400 },
    );
  }

  return { leagueId, season, week };
}

export function espnErrorResponse(err: unknown): NextResponse {
  return NextResponse.json(
    {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    },
    { status: 500 },
  );
}
