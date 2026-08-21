import { NextResponse } from "next/server";
import { getWeekScores } from "@/lib/espn/client";

export async function GET(request: Request) {
  try {
    const leagueId = Number(process.env.LEAGUE_ID);
    const { searchParams } = new URL(request.url);
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

    const weekScores = await getWeekScores(leagueId, season, week);
    return NextResponse.json({ status: "ok", ...weekScores });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
