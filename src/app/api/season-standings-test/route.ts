import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/server";
import { computeSeasonStandings } from "@/lib/all-play/season";

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

    const supabase = getSupabaseClient();

    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .select("id")
      .eq("espn_league_id", leagueId)
      .eq("season", season)
      .single();

    if (leagueError || !league) {
      return NextResponse.json(
        {
          status: "error",
          message:
            leagueError?.message ??
            "No league row found for this espn_league_id/season — has it been ingested yet?",
        },
        { status: 404 },
      );
    }

    const standings = await computeSeasonStandings(league.id as number);

    return NextResponse.json({ status: "ok", season, standings });
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
