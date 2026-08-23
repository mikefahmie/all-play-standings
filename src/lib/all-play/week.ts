import { getSupabaseClient } from "@/lib/supabase/server";
import { computeAllPlayRecords, type TeamScore } from "./compute";
import { resolveRelevantScores } from "./current-week";

export interface WeekTeamResult {
  teamId: number;
  espnTeamId: number;
  teamName: string;
  abbrev: string;
  logoUrl: string | null;
  totalPoints: number;
  wins: number;
  losses: number;
  ties: number;
}

export interface WeekData {
  week: number;
  currentWeek: number;
  isCompleted: boolean;
  availableWeeks: number[];
  results: WeekTeamResult[];
}

interface TeamRow {
  id: number;
  espn_team_id: number;
  name: string;
  abbrev: string;
  logo_url: string | null;
}

interface WeeklyScoreRow {
  team_id: number;
  week: number;
  total_points: number;
  is_completed: boolean;
}

export async function getLeagueDbId(
  espnLeagueId: number,
  season: number,
): Promise<number | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("leagues")
    .select("id")
    .eq("espn_league_id", espnLeagueId)
    .eq("season", season)
    .single<{ id: number }>();

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  return data?.id ?? null;
}

export async function getWeekData(
  leagueId: number,
  week?: number,
): Promise<WeekData | null> {
  const supabase = getSupabaseClient();

  const [
    { data: teamRows, error: teamsError },
    { data: leagueRow, error: leagueError },
    { data: scoreRows, error: scoresError },
  ] = await Promise.all([
    supabase
      .from("teams")
      .select("id, espn_team_id, name, abbrev, logo_url")
      .eq("league_id", leagueId),
    supabase
      .from("leagues")
      .select("current_week")
      .eq("id", leagueId)
      .single<{ current_week: number | null }>(),
    supabase
      .from("weekly_scores")
      .select("team_id, week, total_points, is_completed")
      .eq("league_id", leagueId),
  ]);

  if (teamsError) {
    throw new Error(teamsError.message);
  }

  if (leagueError) {
    throw new Error(leagueError.message);
  }

  if (scoresError) {
    throw new Error(scoresError.message);
  }

  const teams = (teamRows ?? []) as TeamRow[];
  const allScores = (scoreRows ?? []) as WeeklyScoreRow[];
  const { currentWeek, scores } = resolveRelevantScores(
    leagueRow?.current_week,
    allScores,
  );

  if (scores.length === 0) {
    return null;
  }

  const availableWeeks = Array.from(new Set(scores.map((row) => row.week))).sort(
    (a, b) => a - b,
  );

  const targetWeek = week ?? availableWeeks[availableWeeks.length - 1];

  const weekScores = scores.filter((row) => row.week === targetWeek);

  if (weekScores.length === 0) {
    return null;
  }

  const teamById = new Map(teams.map((team) => [team.id, team]));

  const teamScores: TeamScore[] = weekScores.map((row) => ({
    teamId: row.team_id,
    totalPoints: row.total_points,
  }));

  const records = computeAllPlayRecords(teamScores);
  const pointsByTeam = new Map(weekScores.map((row) => [row.team_id, row.total_points]));

  const results: WeekTeamResult[] = records
    .map((record) => {
      const team = teamById.get(record.teamId);
      return {
        teamId: record.teamId,
        espnTeamId: team?.espn_team_id ?? record.teamId,
        teamName: team?.name ?? "Unknown",
        abbrev: team?.abbrev ?? "???",
        logoUrl: team?.logo_url ?? null,
        totalPoints: pointsByTeam.get(record.teamId) ?? 0,
        wins: record.wins,
        losses: record.losses,
        ties: record.ties,
      };
    })
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.totalPoints - a.totalPoints;
    });

  const isCompleted = weekScores.every((row) => row.is_completed);

  return {
    week: targetWeek,
    currentWeek,
    isCompleted,
    availableWeeks,
    results,
  };
}
