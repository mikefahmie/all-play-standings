import { TeamLogo } from "@/components/TeamLogo";
import { formatPoints, formatRecord } from "@/lib/all-play/format";
import type { WeekTeamResult } from "@/lib/all-play/week";

export function WeekRow({ team }: { team: WeekTeamResult }) {
  return (
    <tr className="border-b border-divider">
      <td className="py-3">
        <span className="flex items-center gap-3">
          <TeamLogo logoUrl={team.logoUrl} abbrev={team.abbrev} />
          <span>
            <span className="font-semibold text-foreground">{team.teamName}</span>
            <span className="ml-2 text-xs text-muted">{team.abbrev}</span>
          </span>
        </span>
      </td>
      <td className="py-3 text-right font-mono tabular-nums text-foreground">
        {formatRecord(team.wins, team.losses, team.ties)}
      </td>
      <td className="py-3 text-right font-mono tabular-nums font-bold text-foreground">
        {formatPoints(team.totalPoints)}
      </td>
    </tr>
  );
}

export function WeekCard({ team }: { team: WeekTeamResult }) {
  return (
    <div className="flex items-center gap-3 rounded border border-divider bg-surface px-4 py-3">
      <TeamLogo logoUrl={team.logoUrl} abbrev={team.abbrev} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-foreground">{team.teamName}</div>
        <div className="text-xs text-muted">{team.abbrev}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="font-mono text-xs tabular-nums text-muted">
          {formatRecord(team.wins, team.losses, team.ties)}
        </span>
        <span className="font-mono text-xl font-bold tabular-nums text-foreground">
          {formatPoints(team.totalPoints)}
        </span>
      </div>
    </div>
  );
}
