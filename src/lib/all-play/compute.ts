export interface TeamScore {
  teamId: number;
  totalPoints: number;
}

export interface AllPlayRecord {
  teamId: number;
  wins: number;
  losses: number;
  ties: number;
}

export function computeAllPlayRecords(scores: TeamScore[]): AllPlayRecord[] {
  return scores.map((team) => {
    const record: AllPlayRecord = { teamId: team.teamId, wins: 0, losses: 0, ties: 0 };

    for (const opponent of scores) {
      if (opponent.teamId === team.teamId) continue;

      if (team.totalPoints > opponent.totalPoints) record.wins++;
      else if (team.totalPoints < opponent.totalPoints) record.losses++;
      else record.ties++;
    }

    return record;
  });
}
