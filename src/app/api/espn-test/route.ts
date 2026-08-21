import { NextResponse } from "next/server";
import { getLeagueMetadata } from "@/lib/espn/client";
import { EspnAuthError } from "@/lib/espn/errors";

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

    const metadata = await getLeagueMetadata(leagueId, season);
    return NextResponse.json({ status: "ok", ...metadata });
  } catch (err) {
    if (err instanceof EspnAuthError) {
      console.error("ESPN auth error:", err.message);
      return NextResponse.json(
        {
          status: "error",
          code: "espn_auth_error",
          message: "Someone tell Mike to update the ESPN cookie so I can fetch scores",
        },
        { status: 502 },
      );
    }
    return NextResponse.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
