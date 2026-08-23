import { NextResponse } from "next/server";
import { getWeekScores } from "@/lib/espn/client";
import { EspnAuthError } from "@/lib/espn/errors";
import { parseLeagueWeekParams } from "@/lib/espn/route-helpers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseLeagueWeekParams(searchParams);
    if (parsed instanceof NextResponse) {
      return parsed;
    }
    const { leagueId, season, week } = parsed;

    const weekScores = await getWeekScores(leagueId, season, week);
    return NextResponse.json({ status: "ok", ...weekScores });
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
