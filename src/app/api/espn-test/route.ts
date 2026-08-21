import { NextResponse } from "next/server";
import { getLeagueMetadata } from "@/lib/espn/client";

export async function GET() {
  try {
    const leagueId = Number(process.env.LEAGUE_ID);
    const season = Number(process.env.SEASON);

    if (!leagueId || !season) {
      return NextResponse.json(
        { status: "error", message: "Missing LEAGUE_ID or SEASON env vars." },
        { status: 500 },
      );
    }

    const metadata = await getLeagueMetadata(leagueId, season);
    return NextResponse.json({ status: "ok", ...metadata });
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
