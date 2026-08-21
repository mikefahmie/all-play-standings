import { formatRecord } from "@/lib/all-play/format";
import type { SeasonStanding } from "@/lib/all-play/season";

type Side = { seed: number; standing: SeasonStanding };

const CARD_H = 72;
const MATCHUP_H = 88;
const CARD_W = 208;
const COL_GAP = 72;
const SLOT_GAP = 24;

// Round 1 slot top-Y positions, top to bottom:
// 1) Seed 1 BYE, 2) 4v5, 3) 3v6, 4) Seed 2 BYE
const R1_SEED1_Y = 0;
const R1_45_Y = R1_SEED1_Y + CARD_H + SLOT_GAP;
const R1_36_Y = R1_45_Y + MATCHUP_H + SLOT_GAP;
const R1_SEED2_Y = R1_36_Y + MATCHUP_H + SLOT_GAP;

const R1_SEED1_CENTER = R1_SEED1_Y + CARD_H / 2;
const R1_45_CENTER = R1_45_Y + MATCHUP_H / 2;
const R1_36_CENTER = R1_36_Y + MATCHUP_H / 2;
const R1_SEED2_CENTER = R1_SEED2_Y + CARD_H / 2;

// Semifinals: SF1 (seed 1 vs winner 4/5) centered on those two slots,
// SF2 (seed 2 vs winner 3/6) centered on those two slots.
const SF1_CENTER = (R1_SEED1_CENTER + R1_45_CENTER) / 2;
const SF2_CENTER = (R1_36_CENTER + R1_SEED2_CENTER) / 2;
const SF1_Y = SF1_CENTER - MATCHUP_H / 2;
const SF2_Y = SF2_CENTER - MATCHUP_H / 2;

// Championship centered on the two semifinals.
const CHAMP_CENTER = (SF1_CENTER + SF2_CENTER) / 2;
const CHAMP_Y = CHAMP_CENTER - MATCHUP_H / 2;

const COL1_X = 0;
const COL2_X = CARD_W + COL_GAP;
const COL3_X = COL2_X + CARD_W + COL_GAP;

const SVG_W = COL3_X + CARD_W;
const SVG_H = R1_SEED2_Y + CARD_H;

function ByeCard({
  seed,
  standing,
  y,
}: {
  seed: number;
  standing: SeasonStanding;
  y: number;
}) {
  return (
    <div
      style={{ left: COL1_X, top: y, width: CARD_W, height: CARD_H }}
      className="absolute flex items-center gap-3 rounded border border-divider bg-surface px-4"
    >
      <span className="font-mono text-xl font-bold tabular-nums text-accent">
        {seed}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-foreground">
          {standing.teamName}
        </div>
        <div className="text-xs text-muted">{standing.abbrev}</div>
      </div>
      <span className="rounded bg-divider px-2 py-1 text-xs font-bold uppercase tracking-wide text-muted">
        Bye
      </span>
    </div>
  );
}

function MatchupCard({
  x,
  y,
  topSide,
  bottomSide,
}: {
  x: number;
  y: number;
  topSide: Side;
  bottomSide: Side;
}) {
  return (
    <div
      style={{ left: x, top: y, width: CARD_W, height: MATCHUP_H }}
      className="absolute flex flex-col justify-center gap-1 rounded border border-divider bg-surface px-4 py-2"
    >
      {[topSide, bottomSide].map(({ seed, standing }) => (
        <div key={seed} className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold tabular-nums text-accent">
            {seed}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
            {standing.teamName}
          </span>
          <span className="font-mono text-xs tabular-nums text-muted">
            {formatRecord(standing.wins, standing.losses, standing.ties)}
          </span>
        </div>
      ))}
    </div>
  );
}

function TbdMatchupCard({
  x,
  y,
  height,
  label,
  known,
}: {
  x: number;
  y: number;
  height: number;
  label: string;
  known?: Side;
}) {
  return (
    <div
      style={{ left: x, top: y, width: CARD_W, height }}
      className="absolute flex flex-col justify-center gap-1 rounded border border-dashed border-divider px-4 py-2"
    >
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted">
        {label}
      </div>
      {known ? (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold tabular-nums text-accent">
            {known.seed}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
            {known.standing.teamName}
          </span>
        </div>
      ) : (
        <span className="text-sm text-muted">TBD</span>
      )}
      <span className="text-sm text-muted">TBD</span>
    </div>
  );
}

function connectorPath(x1: number, y1: number, x2: number, y2: number): string {
  const midX = (x1 + x2) / 2;
  return `M ${x1},${y1} H ${midX} V ${y2} H ${x2}`;
}

function DesktopBracket({
  s1,
  s2,
  s3,
  s4,
  s5,
  s6,
}: {
  s1: SeasonStanding;
  s2: SeasonStanding;
  s3: SeasonStanding;
  s4: SeasonStanding;
  s5: SeasonStanding;
  s6: SeasonStanding;
}) {
  const col1Right = COL1_X + CARD_W;
  const col2Left = COL2_X;
  const col2Right = COL2_X + CARD_W;
  const col3Left = COL3_X;

  return (
    <div className="hidden w-full md:block">
      <div
        className="relative"
        style={{ width: SVG_W, height: SVG_H, minWidth: SVG_W }}
      >
        <svg
          className="pointer-events-none absolute inset-0"
          width={SVG_W}
          height={SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          aria-hidden="true"
        >
          <g fill="none" stroke="var(--color-divider)" strokeWidth={2}>
            <path d={connectorPath(col1Right, R1_SEED1_CENTER, col2Left, SF1_CENTER)} />
            <path d={connectorPath(col1Right, R1_45_CENTER, col2Left, SF1_CENTER)} />
            <path d={connectorPath(col1Right, R1_36_CENTER, col2Left, SF2_CENTER)} />
            <path d={connectorPath(col1Right, R1_SEED2_CENTER, col2Left, SF2_CENTER)} />
            <path d={connectorPath(col2Right, SF1_CENTER, col3Left, CHAMP_CENTER)} />
            <path d={connectorPath(col2Right, SF2_CENTER, col3Left, CHAMP_CENTER)} />
          </g>
        </svg>

        {/* Round 1 */}
        <ByeCard seed={1} standing={s1} y={R1_SEED1_Y} />
        <MatchupCard
          x={COL1_X}
          y={R1_45_Y}
          topSide={{ seed: 4, standing: s4 }}
          bottomSide={{ seed: 5, standing: s5 }}
        />
        <MatchupCard
          x={COL1_X}
          y={R1_36_Y}
          topSide={{ seed: 3, standing: s3 }}
          bottomSide={{ seed: 6, standing: s6 }}
        />
        <ByeCard seed={2} standing={s2} y={R1_SEED2_Y} />

        {/* Semifinals */}
        <TbdMatchupCard
          x={COL2_X}
          y={SF1_Y}
          height={MATCHUP_H}
          label="Semifinal"
          known={{ seed: 1, standing: s1 }}
        />
        <TbdMatchupCard
          x={COL2_X}
          y={SF2_Y}
          height={MATCHUP_H}
          label="Semifinal"
          known={{ seed: 2, standing: s2 }}
        />

        {/* Championship */}
        <TbdMatchupCard
          x={COL3_X}
          y={CHAMP_Y}
          height={MATCHUP_H}
          label="Championship"
        />
      </div>
    </div>
  );
}

function MobileByeRow({ seed, standing }: { seed: number; standing: SeasonStanding }) {
  return (
    <div className="flex items-center gap-3 rounded border border-divider bg-surface px-4 py-3">
      <span className="font-mono text-xl font-bold tabular-nums text-accent">
        {seed}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-foreground">
          {standing.teamName}
        </div>
        <div className="text-xs text-muted">{standing.abbrev}</div>
      </div>
      <span className="rounded bg-divider px-2 py-1 text-xs font-bold uppercase tracking-wide text-muted">
        Bye
      </span>
    </div>
  );
}

function MobileMatchupRow({ topSide, bottomSide }: { topSide: Side; bottomSide: Side }) {
  return (
    <div className="flex flex-col gap-1 rounded border border-divider bg-surface px-4 py-3">
      {[topSide, bottomSide].map(({ seed, standing }) => (
        <div key={seed} className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold tabular-nums text-accent">
            {seed}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
            {standing.teamName}
          </span>
          <span className="font-mono text-xs tabular-nums text-muted">
            {formatRecord(standing.wins, standing.losses, standing.ties)}
          </span>
        </div>
      ))}
    </div>
  );
}

function MobileTbdRow({ label, known }: { label: string; known?: Side }) {
  return (
    <div className="flex flex-col gap-1 rounded border border-dashed border-divider px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted">
        {label}
      </div>
      {known ? (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold tabular-nums text-accent">
            {known.seed}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
            {known.standing.teamName}
          </span>
        </div>
      ) : (
        <span className="text-sm text-muted">TBD</span>
      )}
      <span className="text-sm text-muted">TBD</span>
    </div>
  );
}

function MobileBracket({
  s1,
  s2,
  s3,
  s4,
  s5,
  s6,
}: {
  s1: SeasonStanding;
  s2: SeasonStanding;
  s3: SeasonStanding;
  s4: SeasonStanding;
  s5: SeasonStanding;
  s6: SeasonStanding;
}) {
  return (
    <div className="flex flex-col gap-8 md:hidden">
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted">
          Round 1
        </h2>
        <MobileByeRow seed={1} standing={s1} />
        <MobileMatchupRow
          topSide={{ seed: 4, standing: s4 }}
          bottomSide={{ seed: 5, standing: s5 }}
        />
        <MobileMatchupRow
          topSide={{ seed: 3, standing: s3 }}
          bottomSide={{ seed: 6, standing: s6 }}
        />
        <MobileByeRow seed={2} standing={s2} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted">
          Semifinals
        </h2>
        <MobileTbdRow label="Semifinal" known={{ seed: 1, standing: s1 }} />
        <MobileTbdRow label="Semifinal" known={{ seed: 2, standing: s2 }} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted">
          Championship
        </h2>
        <MobileTbdRow label="Championship" />
      </div>
    </div>
  );
}

export function BracketView({ seeds }: { seeds: SeasonStanding[] }) {
  const [s1, s2, s3, s4, s5, s6] = seeds;

  return (
    <>
      <DesktopBracket s1={s1} s2={s2} s3={s3} s4={s4} s5={s5} s6={s6} />
      <MobileBracket s1={s1} s2={s2} s3={s3} s4={s4} s5={s5} s6={s6} />
    </>
  );
}
