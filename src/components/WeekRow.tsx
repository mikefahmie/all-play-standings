"use client";

import Image from "next/image";
import { useState } from "react";
import { TeamLogo } from "@/components/TeamLogo";
import { formatPoints, formatRecord } from "@/lib/all-play/format";
import type { WeekTeamResult } from "@/lib/all-play/week";

interface BoxscorePlayerView {
  playerId: number;
  fullName: string;
  position: string;
  proTeam: string;
  points: number;
  headshotUrl: string;
}

type BoxscoreState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; players: BoxscorePlayerView[] };

export function WeekCard({ team, week }: { team: WeekTeamResult; week: number }) {
  const [expanded, setExpanded] = useState(false);
  const [boxscore, setBoxscore] = useState<BoxscoreState>({ status: "idle" });

  async function handleToggle() {
    const next = !expanded;
    setExpanded(next);

    if (next) {
      setBoxscore({ status: "loading" });
      try {
        const res = await fetch(`/api/boxscore?week=${week}&teamId=${team.teamId}`);
        const data = await res.json();
        if (!res.ok || data.status !== "ok") {
          setBoxscore({ status: "error", message: data.message ?? "Failed to load lineup." });
          return;
        }
        const players = [...(data.players as BoxscorePlayerView[])].sort(
          (a, b) => b.points - a.points,
        );
        setBoxscore({ status: "loaded", players });
      } catch {
        setBoxscore({ status: "error", message: "Failed to load lineup." });
      }
    }
  }

  return (
    <div className="rounded border border-divider bg-[image:var(--gradient-surface)]">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
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
      </button>

      {expanded && (
        <div className="border-t border-divider px-4 py-3">
          {boxscore.status === "loading" && (
            <div className="flex animate-pulse flex-col gap-2">
              <div className="h-8 w-full rounded bg-divider" />
              <div className="h-8 w-full rounded bg-divider" />
            </div>
          )}
          {boxscore.status === "error" && (
            <p className="text-sm text-error" role="alert">
              {boxscore.message}
            </p>
          )}
          {boxscore.status === "loaded" && (
            <div className="flex flex-col gap-2">
              {boxscore.players.map((player) => (
                <div key={player.playerId} className="flex items-center gap-3">
                  <Image
                    src={player.headshotUrl}
                    alt=""
                    width={28}
                    height={28}
                    className="shrink-0 rounded-full bg-divider object-cover"
                    unoptimized
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-foreground">{player.fullName}</div>
                    <div className="text-xs text-muted">
                      {player.position} · {player.proTeam}
                    </div>
                  </div>
                  <span className="font-mono text-sm tabular-nums text-foreground">
                    {formatPoints(player.points)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
