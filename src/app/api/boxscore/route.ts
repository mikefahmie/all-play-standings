import { NextResponse } from "next/server";
import { getTeamBoxscore } from "@/lib/espn/client";
import { EspnAuthError } from "@/lib/espn/errors";
import { getPlayerHeadshotUrl, getPositionName, getProTeamAbbreviation } from "@/lib/espn/enums";

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

    const teamIdParam = searchParams.get("teamId");
    const teamId = Number(teamIdParam);

    if (!teamIdParam || !Number.isInteger(teamId) || teamId < 1) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Missing or invalid 'teamId' query param — expected a positive integer, e.g. ?teamId=1.",
        },
        { status: 400 },
      );
    }

    const boxscore = await getTeamBoxscore(leagueId, season, week, teamId);

    if (!boxscore) {
      return NextResponse.json(
        { status: "error", message: "No boxscore found for that week/teamId." },
        { status: 404 },
      );
    }

    const players = boxscore.players.map((player) => ({
      playerId: player.playerId,
      fullName: player.fullName,
      position: getPositionName(player.positionId),
      proTeam: getProTeamAbbreviation(player.proTeamId),
      points: player.points,
      headshotUrl: getPlayerHeadshotUrl(player.playerId, player.proTeamId),
    }));

    return NextResponse.json({ status: "ok", teamId: boxscore.teamId, players });
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
