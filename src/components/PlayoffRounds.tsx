import { TeamLogo } from "@/components/TeamLogo";
import { formatPoints } from "@/lib/all-play/format";
import type { PlayoffData, PlayoffTeamResult } from "@/lib/all-play/playoffs";

function PlayoffTeamRow({
  rank,
  team,
  advanceCount,
  isComplete,
}: {
  rank: number;
  team: PlayoffTeamResult;
  advanceCount: number;
  isComplete: boolean;
}) {
  return (
    <>
      <div className="flex items-center gap-3 rounded border border-divider bg-[image:var(--gradient-surface)] px-4 py-3">
        <span className="font-display text-2xl font-bold tabular-nums text-foreground">
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-3">
            <TeamLogo logoUrl={team.logoUrl} abbrev={team.abbrev} />
            <span className="min-w-0">
              <span className="block truncate font-semibold text-foreground">
                {team.teamName}
              </span>
              <span className="text-xs text-muted">{team.abbrev}</span>
            </span>
          </span>
        </div>
        <div className="flex shrink-0 items-end gap-4">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] uppercase tracking-wide text-muted">
              Week Points
            </span>
            <span className="font-display text-2xl font-bold tabular-nums text-foreground">
              {formatPoints(team.weekPoints)}
            </span>
          </div>
        </div>
      </div>
      {isComplete && rank === advanceCount && (
        <div className="flex items-center gap-3" aria-hidden="true">
          <div className="h-0.5 flex-1 rounded bg-accent" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
            {advanceCount === 1 ? "Champion" : "Advances"}
          </span>
          <div className="h-0.5 flex-1 rounded bg-accent" />
        </div>
      )}
    </>
  );
}

const FORMAT_ROUNDS = [
  { week: 15, label: "Round 1", detail: "All 6 qualifiers play. Bottom 2 scores are cut." },
  { week: 16, label: "Round 2", detail: "Remaining 4 play. Bottom 2 scores are cut." },
  { week: 17, label: "Round 3", detail: "Final 2 play. Highest score is champion." },
] as const;

export function PlayoffFormatExplainer() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1 rounded border border-divider bg-[image:var(--gradient-surface)] px-4 py-4 text-center sm:px-6">
        <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
          Playoffs Begin Week 15
        </span>
        <p className="text-sm text-muted">
          The top 6 teams by <span className="text-foreground">all-play record</span> —
          not ESPN&apos;s standings — make the field. No byes: every team left plays
          every round.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {FORMAT_ROUNDS.map((round) => (
          <div
            key={round.week}
            className="flex items-center gap-4 rounded border border-divider bg-[image:var(--gradient-surface)] px-4 py-3"
          >
            <div className="flex shrink-0 flex-col items-center">
              <span className="font-display text-2xl font-bold tabular-nums text-foreground">
                {round.week}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted">Week</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block font-semibold text-foreground">{round.label}</span>
              <span className="block text-sm text-muted">{round.detail}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted">
        Each round is decided by that week&apos;s score only — season totals only break ties.
      </p>
    </div>
  );
}

export function PlayoffRounds({ data }: { data: PlayoffData }) {
  const { rounds, champion } = data;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <p className="text-center text-sm text-muted">
        Seeded by <span className="text-foreground">all-play record</span>, not ESPN&apos;s
        standings. No byes — each round is decided by that week&apos;s score only.
      </p>

      {champion && (
        <div className="flex flex-col items-center gap-2 rounded border border-accent bg-[image:var(--gradient-surface)] px-4 py-6 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
            League Champion
          </span>
          <span className="flex items-center gap-3">
            <TeamLogo logoUrl={champion.logoUrl} abbrev={champion.abbrev} />
            <span className="font-display text-2xl font-bold text-foreground">
              {champion.teamName}
            </span>
          </span>
        </div>
      )}

      {rounds.map((round) => (
        <div key={round.week} className="flex flex-col gap-2">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {round.label}{" "}
            <span className="text-sm font-normal text-muted">Week {round.week}</span>
          </h2>

          {!round.isStarted ? (
            <p className="text-sm text-muted">Not started yet.</p>
          ) : (
            round.teams.map((team, index) => (
              <PlayoffTeamRow
                key={team.teamId}
                rank={index + 1}
                team={team}
                advanceCount={round.advanceCount}
                isComplete={round.isComplete}
              />
            ))
          )}
        </div>
      ))}
    </div>
  );
}
