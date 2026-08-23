import { NextResponse } from "next/server";
import { getLeagueDbId } from "@/lib/all-play/week";
import { getTeamBoxscore } from "@/lib/espn/client";
import { EspnAuthError } from "@/lib/espn/errors";
import { getPlayerHeadshotUrl, getPositionName, getProTeamAbbreviation } from "@/lib/espn/enums";
import { parseLeagueWeekParams } from "@/lib/espn/route-helpers";
import { getSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseLeagueWeekParams(searchParams);
    if (parsed instanceof NextResponse) {
      return parsed;
    }
    const { leagueId, season, week } = parsed;

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

    const leagueDbId = await getLeagueDbId(leagueId, season);
    if (leagueDbId) {
      const { data: leagueRow } = await getSupabaseClient()
        .from("leagues")
        .select("current_week")
        .eq("id", leagueDbId)
        .single<{ current_week: number | null }>();

      if (leagueRow?.current_week && week !== leagueRow.current_week) {
        return NextResponse.json(
          {
            status: "error",
            message: "Lineups are only available for the current week.",
          },
          { status: 400 },
        );
      }
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
