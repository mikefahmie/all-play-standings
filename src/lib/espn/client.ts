import { EspnAuthError } from "./errors";

export interface EspnTeam {
  id: number;
  name: string;
  abbrev: string;
  logo: string;
}

export interface EspnMatchupTeam {
  teamId: number;
  totalPoints: number;
}

export interface EspnMatchup {
  matchupPeriodId: number;
  home: EspnMatchupTeam;
  away: EspnMatchupTeam | null;
}

export interface LeagueMetadata {
  teams: EspnTeam[];
  currentWeek: number;
  schedule: EspnMatchup[];
}

export interface TeamWeekScore {
  teamId: number;
  totalPoints: number;
}

export interface WeekScores {
  week: number;
  isCompleted: boolean;
  teamScores: TeamWeekScore[];
}

export interface BoxscorePlayer {
  playerId: number;
  fullName: string;
  positionId: number;
  proTeamId: number;
  points: number;
}

export interface TeamBoxscore {
  teamId: number;
  players: BoxscorePlayer[];
}

interface EspnTeamResponse {
  id: number;
  name?: string;
  location?: string;
  nickname?: string;
  abbrev: string;
  logo?: string;
}

interface EspnRosterEntryResponse {
  lineupSlotId: number;
  playerId: number;
  playerPoolEntry: {
    appliedStatTotal?: number;
    player: {
      fullName: string;
      defaultPositionId: number;
      proTeamId: number;
    };
  };
}

interface EspnMatchupTeamResponse {
  teamId: number;
  totalPoints?: number;
  rosterForCurrentScoringPeriod?: {
    entries: EspnRosterEntryResponse[];
  };
}

interface EspnMatchupResponse {
  matchupPeriodId: number;
  home: EspnMatchupTeamResponse;
  away?: EspnMatchupTeamResponse;
}

interface EspnLeagueResponse {
  teams: EspnTeamResponse[];
  schedule: EspnMatchupResponse[];
  status: {
    currentMatchupPeriod: number;
  };
}

const BENCH_SLOT_ID = 20;
const IR_SLOT_ID = 21;

function getEspnCookieHeader(): string {
  const espnS2 = process.env.espn_s2;
  const swid = process.env.ESPN_SWID;

  if (!espnS2 || !swid) {
    throw new EspnAuthError(
      "Missing ESPN auth env vars: espn_s2 and ESPN_SWID must be set.",
    );
  }

  return `espn_s2=${espnS2}; SWID=${swid}`;
}

function resolveTeamName(team: EspnTeamResponse): string {
  if (team.name) return team.name;
  return `${team.location ?? ""} ${team.nickname ?? ""}`.trim();
}

async function fetchLeagueData(
  leagueId: number,
  season: number,
  extraQuery = "",
): Promise<EspnLeagueResponse> {
  const url =
    `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}` +
    `/segments/0/leagues/${leagueId}?view=mTeam&view=mSettings&view=mMatchupScore${extraQuery}`;

  const response = await fetch(url, {
    headers: { Cookie: getEspnCookieHeader() },
  });

  if (response.status === 401 || response.status === 403) {
    throw new EspnAuthError(
      "ESPN API auth failed (401/403) — espn_s2/ESPN_SWID cookies are likely expired or invalid.",
    );
  }

  if (!response.ok) {
    throw new Error(
      `ESPN API request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

function mapMatchupTeam(
  team: { teamId: number; totalPoints?: number } | undefined,
): TeamWeekScore | null {
  if (!team) return null;
  return { teamId: team.teamId, totalPoints: team.totalPoints ?? 0 };
}

export async function getLeagueMetadata(
  leagueId: number,
  season: number,
): Promise<LeagueMetadata> {
  const data = await fetchLeagueData(leagueId, season);

  const teams: EspnTeam[] = data.teams.map((team) => ({
    id: team.id,
    name: resolveTeamName(team),
    abbrev: team.abbrev,
    logo: team.logo ?? "",
  }));

  const schedule: EspnMatchup[] = data.schedule.map((matchup) => ({
    matchupPeriodId: matchup.matchupPeriodId,
    home: mapMatchupTeam(matchup.home) ?? { teamId: matchup.home.teamId, totalPoints: 0 },
    away: mapMatchupTeam(matchup.away),
  }));

  return {
    teams,
    currentWeek: data.status.currentMatchupPeriod,
    schedule,
  };
}

export async function getWeekScores(
  leagueId: number,
  season: number,
  week: number,
): Promise<WeekScores> {
  const data = await fetchLeagueData(leagueId, season);

  const teamScores: TeamWeekScore[] = data.schedule
    .filter((matchup) => matchup.matchupPeriodId === week)
    .flatMap((matchup) =>
      [mapMatchupTeam(matchup.home), mapMatchupTeam(matchup.away)].filter(
        (team): team is TeamWeekScore => team !== null,
      ),
    );

  return {
    week,
    isCompleted: week < data.status.currentMatchupPeriod,
    teamScores,
  };
}

export async function getAllWeekScores(
  leagueId: number,
  season: number,
): Promise<WeekScores[]> {
  const data = await fetchLeagueData(leagueId, season);

  const scoresByWeek = new Map<number, TeamWeekScore[]>();
  for (const matchup of data.schedule) {
    const teamScores = [mapMatchupTeam(matchup.home), mapMatchupTeam(matchup.away)].filter(
      (team): team is TeamWeekScore => team !== null,
    );
    if (teamScores.length === 0) continue;

    const existing = scoresByWeek.get(matchup.matchupPeriodId) ?? [];
    scoresByWeek.set(matchup.matchupPeriodId, existing.concat(teamScores));
  }

  return Array.from(scoresByWeek.entries())
    .sort(([weekA], [weekB]) => weekA - weekB)
    .map(([week, teamScores]) => ({
      week,
      isCompleted: week < data.status.currentMatchupPeriod,
      teamScores,
    }));
}

function mapBoxscorePlayers(
  entries: EspnRosterEntryResponse[] | undefined,
): BoxscorePlayer[] {
  if (!entries) return [];

  return entries
    .filter(
      (entry) => entry.lineupSlotId !== BENCH_SLOT_ID && entry.lineupSlotId !== IR_SLOT_ID,
    )
    .map((entry) => ({
      playerId: entry.playerId,
      fullName: entry.playerPoolEntry.player.fullName,
      positionId: entry.playerPoolEntry.player.defaultPositionId,
      proTeamId: entry.playerPoolEntry.player.proTeamId,
      points: entry.playerPoolEntry.appliedStatTotal ?? 0,
    }));
}

export async function getTeamBoxscore(
  leagueId: number,
  season: number,
  week: number,
  teamId: number,
): Promise<TeamBoxscore | null> {
  const data = await fetchLeagueData(leagueId, season, `&view=mBoxscore&scoringPeriodId=${week}`);

  const matchups = data.schedule.filter((m) => m.matchupPeriodId === week);
  const teamSide = matchups
    .flatMap((m) => [m.home, m.away])
    .find((side) => side?.teamId === teamId);
  if (!teamSide) return null;

  return {
    teamId,
    players: mapBoxscorePlayers(teamSide.rosterForCurrentScoringPeriod?.entries),
  };
}
