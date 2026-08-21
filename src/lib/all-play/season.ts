import { getSupabaseClient } from "@/lib/supabase/server";
import { computeAllPlayRecords, type TeamScore } from "./compute";

export interface SeasonStanding {
  teamId: number;
  teamName: string;
  abbrev: string;
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
}

interface TeamRow {
  id: number;
  name: string;
  abbrev: string;
}

export async function computeSeasonStandings(
  leagueId: number,
): Promise<SeasonStanding[]> {
  const supabase = getSupabaseClient();

  const { data: teamRows, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, abbrev")
    .eq("league_id", leagueId);

  if (teamsError) {
    throw new Error(teamsError.message);
  }

  const teams = (teamRows ?? []) as TeamRow[];

  const { data: scoreRows, error: scoresError } = await supabase
    .from("weekly_scores")
    .select("team_id, week, total_points")
    .eq("league_id", leagueId);

  if (scoresError) {
    throw new Error(scoresError.message);
  }

  const scoresByWeek = new Map<number, TeamScore[]>();
  for (const row of (scoreRows ?? []) as WeeklyScoreRow[]) {
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
