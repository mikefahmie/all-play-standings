import { getSupabaseClient } from "@/lib/supabase/server";
import { computeAllPlayRecords, type TeamScore } from "./compute";
import { resolveRelevantScores } from "./current-week";
import { computeSeasonStandings } from "./season";

const PLAYOFFS_START_WEEK = 15;

const ROUNDS = [
  { week: 15, label: "Round 1", advanceCount: 4 },
  { week: 16, label: "Round 2", advanceCount: 2 },
  { week: 17, label: "Round 3", advanceCount: 1 },
] as const;

export interface PlayoffTeamResult {
  teamId: number;
  teamName: string;
  abbrev: string;
  logoUrl: string | null;
  weekPoints: number;
  seasonPoints: number;
  advanced: boolean;
}

export interface PlayoffRound {
  week: number;
  label: string;
  advanceCount: number;
  isStarted: boolean;
  isComplete: boolean;
  teams: PlayoffTeamResult[];
}

export interface PlayoffData {
  rounds: PlayoffRound[];
  champion: PlayoffTeamResult | null;
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

export async function getPlayoffData(leagueId: number): Promise<PlayoffData | null> {
  const supabase = getSupabaseClient();

  const [
    { data: teamRows, error: teamsError },
    { data: leagueRow, error: leagueError },
    { data: scoreRows, error: scoresError },
  ] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, abbrev, logo_url")
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

  if (teamsError) throw new Error(teamsError.message);
  if (leagueError) throw new Error(leagueError.message);
  if (scoresError) throw new Error(scoresError.message);

  const teams = (teamRows ?? []) as TeamRow[];
  const allScores = (scoreRows ?? []) as WeeklyScoreRow[];
  const { currentWeek, scores } = resolveRelevantScores(
    leagueRow?.current_week,
    allScores,
  );

  if (currentWeek < PLAYOFFS_START_WEEK) {
    return null;
  }

  const teamById = new Map(teams.map((team) => [team.id, team]));
  const seasonPointsByTeam = new Map<number, number>();
  for (const row of scores) {
    if (!row.is_completed) continue;
    seasonPointsByTeam.set(
      row.team_id,
      (seasonPointsByTeam.get(row.team_id) ?? 0) + row.total_points,
    );
  }

  const scoresByWeek = new Map<number, Map<number, WeeklyScoreRow>>();
  for (const row of scores) {
    const weekRows = scoresByWeek.get(row.week) ?? new Map<number, WeeklyScoreRow>();
    weekRows.set(row.team_id, row);
    scoresByWeek.set(row.week, weekRows);
  }

  const seasonStandings = await computeSeasonStandings(leagueId);
  let field = seasonStandings.slice(0, 6).map((standing) => standing.teamId);

  const rounds: PlayoffRound[] = [];
  let champion: PlayoffTeamResult | null = null;

  for (const roundDef of ROUNDS) {
    const weekRows = scoresByWeek.get(roundDef.week);
    const isStarted = field.some((teamId) => weekRows?.has(teamId));

    if (!isStarted) {
      rounds.push({
        week: roundDef.week,
        label: roundDef.label,
        advanceCount: roundDef.advanceCount,
        isStarted: false,
        isComplete: false,
        teams: [],
      });
      break;
    }

    const teamScores: TeamScore[] = field.map((teamId) => ({
      teamId,
      totalPoints: weekRows?.get(teamId)?.total_points ?? 0,
    }));
    const records = computeAllPlayRecords(teamScores);
    const winsByTeam = new Map(records.map((record) => [record.teamId, record.wins]));

    const ranked = field
      .map((teamId) => ({
        teamId,
        weekPoints: weekRows?.get(teamId)?.total_points ?? 0,
        seasonPoints: seasonPointsByTeam.get(teamId) ?? 0,
        wins: winsByTeam.get(teamId) ?? 0,
      }))
      .sort((a, b) => {
        if (b.weekPoints !== a.weekPoints) return b.weekPoints - a.weekPoints;
        return b.seasonPoints - a.seasonPoints;
      });

    const isComplete = field.every((teamId) => weekRows?.get(teamId)?.is_completed);

    const teamResults: PlayoffTeamResult[] = ranked.map((entry, index) => {
      const team = teamById.get(entry.teamId);
      return {
        teamId: entry.teamId,
        teamName: team?.name ?? "Unknown",
        abbrev: team?.abbrev ?? "???",
        logoUrl: team?.logo_url ?? null,
        weekPoints: entry.weekPoints,
        seasonPoints: entry.seasonPoints,
        advanced: isComplete && index < roundDef.advanceCount,
      };
    });

    rounds.push({
      week: roundDef.week,
      label: roundDef.label,
      advanceCount: roundDef.advanceCount,
      isStarted: true,
      isComplete,
      teams: teamResults,
    });

    if (!isComplete) break;

    if (roundDef.advanceCount === 1) {
      champion = teamResults[0] ?? null;
      break;
    }

    field = teamResults.slice(0, roundDef.advanceCount).map((result) => result.teamId);
  }

  return { rounds, champion };
}
