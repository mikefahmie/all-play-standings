import { getAllWeekScores, getLeagueMetadata } from "@/lib/espn/client";
import { EspnAuthError } from "@/lib/espn/errors";
import { getSupabaseClient } from "@/lib/supabase/server";

export type IngestResult =
  | {
      status: "ok";
      weeksUpserted: number[];
      teamsUpserted: number;
      scoresUpserted: number;
    }
  | {
      status: "error";
      message: string;
    };

function errorMessage(err: unknown): string {
  if (err instanceof EspnAuthError) {
    return "Someone tell Mike to update the ESPN cookie so I can fetch scores";
  }
  return err instanceof Error ? err.message : "Unknown error";
}

export async function ingestAllWeeks(
  leagueId: number,
  season: number,
): Promise<IngestResult> {
  const supabase = getSupabaseClient();

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .upsert(
      { espn_league_id: leagueId, season },
      { onConflict: "espn_league_id,season" },
    )
    .select("id")
    .single();

  if (leagueError || !league) {
    return {
      status: "error",
      message: leagueError?.message ?? "Failed to resolve league row",
    };
  }

  const internalLeagueId = league.id as number;

  const { error: attemptError } = await supabase
    .from("ingestion_state")
    .upsert(
      { league_id: internalLeagueId, last_attempted_at: new Date().toISOString() },
      { onConflict: "league_id" },
    );

  if (attemptError) {
    return { status: "error", message: attemptError.message };
  }

  try {
    const metadata = await getLeagueMetadata(leagueId, season);
    const allWeekScores = await getAllWeekScores(leagueId, season);

    const { data: upsertedTeams, error: teamsError } = await supabase
      .from("teams")
      .upsert(
        metadata.teams.map((team) => ({
          league_id: internalLeagueId,
          espn_team_id: team.id,
          name: team.name,
          abbrev: team.abbrev,
          logo_url: team.logo,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "league_id,espn_team_id" },
      )
      .select("id, espn_team_id");

    if (teamsError || !upsertedTeams) {
      throw new Error(teamsError?.message ?? "Failed to upsert teams");
    }

    const teamIdByEspnId = new Map<number, number>(
      upsertedTeams.map((team) => [team.espn_team_id as number, team.id as number]),
    );

    const nowIso = new Date().toISOString();
    const scoreRows = allWeekScores.flatMap((weekScores) =>
      weekScores.teamScores.map((score) => {
        const teamId = teamIdByEspnId.get(score.teamId);
        if (teamId === undefined) {
          throw new Error(`No team row found for ESPN team ${score.teamId}`);
        }
        return {
          league_id: internalLeagueId,
          team_id: teamId,
          week: weekScores.week,
          total_points: score.totalPoints,
          is_completed: weekScores.isCompleted,
          updated_at: nowIso,
        };
      }),
    );

    const { error: scoresError } = await supabase
      .from("weekly_scores")
      .upsert(scoreRows, { onConflict: "league_id,team_id,week" });

    if (scoresError) {
      throw new Error(scoresError.message);
    }

    await supabase
      .from("ingestion_state")
      .upsert(
        {
          league_id: internalLeagueId,
          last_ingested_at: new Date().toISOString(),
          last_error: null,
        },
        { onConflict: "league_id" },
      );

    return {
      status: "ok",
      weeksUpserted: allWeekScores.map((weekScores) => weekScores.week),
      teamsUpserted: upsertedTeams.length,
      scoresUpserted: scoreRows.length,
    };
  } catch (err) {
    const message = errorMessage(err);

    await supabase
      .from("ingestion_state")
      .upsert(
        { league_id: internalLeagueId, last_error: message },
        { onConflict: "league_id" },
      );

    return { status: "error", message };
  }
}
