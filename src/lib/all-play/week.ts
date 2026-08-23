import { getSupabaseClient } from "@/lib/supabase/server";
import { computeAllPlayRecords, type TeamScore } from "./compute";

export interface WeekTeamResult {
  teamId: number;
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
  isCompleted: boolean;
  availableWeeks: number[];
  results: WeekTeamResult[];
}

interface TeamRow {
  id: number;
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

  const { data: teamRows, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, abbrev, logo_url")
    .eq("league_id", leagueId);

  if (teamsError) {
    throw new Error(teamsError.message);
  }

  const { data: scoreRows, error: scoresError } = await supabase
    .from("weekly_scores")
    .select("team_id, week, total_points, is_completed")
    .eq("league_id", leagueId);

  if (scoresError) {
    throw new Error(scoresError.message);
  }

  const teams = (teamRows ?? []) as TeamRow[];
  const scores = (scoreRows ?? []) as WeeklyScoreRow[];

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
    isCompleted,
    availableWeeks,
    results,
  };
}
