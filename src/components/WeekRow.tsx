import { TeamLogo } from "@/components/TeamLogo";
import { formatPoints, formatRecord } from "@/lib/all-play/format";
import type { WeekTeamResult } from "@/lib/all-play/week";

export function WeekCard({ team }: { team: WeekTeamResult }) {
  return (
    <div className="flex items-center gap-3 rounded border border-divider bg-[image:var(--gradient-surface)] px-4 py-3">
      <TeamLogo logoUrl={team.logoUrl} abbrev={team.abbrev} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-foreground">{team.teamName}</div>
        <div className="text-xs text-muted">{team.abbrev}</div>
      </div>
      <div className="flex items-end gap-4">
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-muted">Record</span>
          <span className="font-mono text-sm tabular-nums text-foreground">
            {formatRecord(team.wins, team.losses, team.ties)}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-muted">Score</span>
          <span className="font-display text-3xl font-bold tabular-nums text-foreground">
            {formatPoints(team.totalPoints)}
          </span>
        </div>
      </div>
    </div>
  );
}
