import { getSupabaseClient } from "@/lib/supabase/server";
import { computeAllPlayRecords, type TeamScore } from "./compute";

export interface SeasonStanding {
  teamId: number;
  teamName: string;
  abbrev: string;
  logoUrl: string | null;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  totalPoints: number;
  rank: number;
}

interface WeeklyScoreRow {
  team_id: number;
  week: number;
  total_points: number;
  is_completed: boolean;
}

interface TeamRow {
  id: number;
  name: string;
  abbrev: string;
  logo_url: string | null;
}

async function fetchTeamsAndScores(
  leagueId: number,
): Promise<{ teams: TeamRow[]; scoreRows: WeeklyScoreRow[]; currentWeek: number }> {
  const supabase = getSupabaseClient();

  const { data: teamRows, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, abbrev, logo_url")
    .eq("league_id", leagueId);

  if (teamsError) {
    throw new Error(teamsError.message);
  }

  const { data: leagueRow, error: leagueError } = await supabase
    .from("leagues")
    .select("current_week")
    .eq("id", leagueId)
    .single<{ current_week: number | null }>();

  if (leagueError) {
    throw new Error(leagueError.message);
  }

  const { data: scoreRows, error: scoresError } = await supabase
    .from("weekly_scores")
    .select("team_id, week, total_points, is_completed")
    .eq("league_id", leagueId);

  if (scoresError) {
    throw new Error(scoresError.message);
  }

  const allScoreRows = (scoreRows ?? []) as WeeklyScoreRow[];
  const currentWeek =
    leagueRow?.current_week ??
    allScoreRows.reduce((max, row) => Math.max(max, row.week), 0);

  const relevantScoreRows = allScoreRows.filter(
    (row) => row.is_completed || row.week === currentWeek,
  );

  return {
    teams: (teamRows ?? []) as TeamRow[],
    scoreRows: relevantScoreRows,
    currentWeek,
  };
}

function aggregateStandings(
  teams: TeamRow[],
  scoreRows: WeeklyScoreRow[],
  throughWeek?: number,
): SeasonStanding[] {
  const scoresByWeek = new Map<number, TeamScore[]>();
  for (const row of scoreRows) {
    if (throughWeek !== undefined && row.week > throughWeek) continue;

    const weekScores = scoresByWeek.get(row.week) ?? [];
    weekScores.push({ teamId: row.team_id, totalPoints: row.total_points });
    scoresByWeek.set(row.week, weekScores);
  }

  const totals = new Map<
    number,
    { wins: number; losses: number; ties: number; totalPoints: number }
  >();
  for (const team of teams) {
    totals.set(team.id, { wins: 0, losses: 0, ties: 0, totalPoints: 0 });
  }

  for (const weekScores of scoresByWeek.values()) {
    const records = computeAllPlayRecords(weekScores);

    for (const record of records) {
      const totalsEntry = totals.get(record.teamId);
      if (!totalsEntry) continue;

      totalsEntry.wins += record.wins;
      totalsEntry.losses += record.losses;
      totalsEntry.ties += record.ties;
    }

    for (const score of weekScores) {
      const totalsEntry = totals.get(score.teamId);
      if (!totalsEntry) continue;

      totalsEntry.totalPoints += score.totalPoints;
    }
  }

  const standings: SeasonStanding[] = teams.map((team) => {
    const totalsEntry = totals.get(team.id)!;
    const gamesPlayed = totalsEntry.wins + totalsEntry.losses + totalsEntry.ties;

    return {
      teamId: team.id,
      teamName: team.name,
      abbrev: team.abbrev,
      logoUrl: team.logo_url,
      wins: totalsEntry.wins,
      losses: totalsEntry.losses,
      ties: totalsEntry.ties,
      winPct: gamesPlayed > 0 ? totalsEntry.wins / gamesPlayed : 0,
      totalPoints: totalsEntry.totalPoints,
      rank: 0,
    };
  });

  standings.sort((a, b) => {
    if (b.winPct !== a.winPct) return b.winPct - a.winPct;
    return b.totalPoints - a.totalPoints;
  });

  standings.forEach((standing, index) => {
    standing.rank = index + 1;
  });

  return standings;
}

export async function computeSeasonStandings(
  leagueId: number,
): Promise<SeasonStanding[]> {
  const { teams, scoreRows } = await fetchTeamsAndScores(leagueId);
  return aggregateStandings(teams, scoreRows);
}

export type Trend = "up" | "down" | "flat" | null;

export interface SeasonStandingWithTrend extends SeasonStanding {
  trend: Trend;
}

function attachTrend(
  standings: SeasonStanding[],
  priorStandings: SeasonStanding[] | null,
): SeasonStandingWithTrend[] {
  if (!priorStandings) {
    return standings.map((standing) => ({ ...standing, trend: null }));
  }

  const priorRankByTeam = new Map(
    priorStandings.map((standing) => [standing.teamId, standing.rank]),
  );

  return standings.map((standing) => {
    const priorRank = priorRankByTeam.get(standing.teamId);
    let trend: Trend = null;

    if (priorRank !== undefined) {
      if (standing.rank < priorRank) trend = "up";
      else if (standing.rank > priorRank) trend = "down";
      else trend = "flat";
    }

    return { ...standing, trend };
  });
}

export interface SeasonStandingsResult {
  standings: SeasonStandingWithTrend[];
  standingsExcludingCurrentWeek: SeasonStandingWithTrend[] | null;
  currentWeek: number;
}

export async function getSeasonStandingsWithTrend(
  leagueId: number,
): Promise<SeasonStandingsResult> {
  const { teams, scoreRows, currentWeek } = await fetchTeamsAndScores(leagueId);

  const standings = aggregateStandings(teams, scoreRows);
  const priorStandings =
    currentWeek > 1 ? aggregateStandings(teams, scoreRows, currentWeek - 1) : null;

  const standingsWithTrend = attachTrend(standings, priorStandings);

  const standingsExcludingCurrentWeek =
    currentWeek > 1
      ? attachTrend(
          priorStandings!,
          currentWeek > 2 ? aggregateStandings(teams, scoreRows, currentWeek - 2) : null,
        )
      : null;

  return {
    standings: standingsWithTrend,
    standingsExcludingCurrentWeek,
    currentWeek,
  };
}
