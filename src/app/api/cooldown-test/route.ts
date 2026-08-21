import { NextResponse } from "next/server";
import { checkAndTriggerIngestion } from "@/lib/ingestion/cooldown";

export async function GET(request: Request) {
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

  const result = await checkAndTriggerIngestion(leagueId, season);

  if (result.status === "error") {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result);
}
