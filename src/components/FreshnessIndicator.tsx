"use client";

import { useEffect, useState } from "react";
import { useFreshness } from "@/hooks/useFreshness";

function formatAgo(iso: string | null, now: number): string {
  if (!iso) return "never";

  const diffMs = now - new Date(iso).getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function FreshnessIndicator() {
  const {
    lastIngestedAt,
    lastError,
    cooldownRemainingMs,
    isRefreshing,
    fetchError,
    refresh,
  } = useFreshness();

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const onCooldown = cooldownRemainingMs > 0;
  const disabled = isRefreshing || onCooldown;

  let buttonLabel: string;
  if (isRefreshing) {
    buttonLabel = "Refreshing…";
  } else if (onCooldown) {
    buttonLabel = `Refresh available in ${formatCountdown(cooldownRemainingMs)}`;
  } else {
    buttonLabel = "Refresh";
  }

  const error = fetchError ?? lastError;

  return (
    <div className="flex flex-col items-center gap-2 font-sans">
      <div className="flex items-center gap-3 rounded border border-divider bg-[image:var(--gradient-surface)] px-4 py-2">
        <span className="text-sm text-muted">
          Last updated{" "}
          <span className="font-mono tabular-nums text-foreground">
            {formatAgo(lastIngestedAt, now)}
          </span>
        </span>
        <button
          type="button"
          onClick={() => refresh()}
          disabled={disabled}
          aria-live="polite"
          className={`rounded px-3 py-1 text-sm font-semibold tracking-tight transition-colors ${
            disabled
              ? onCooldown
                ? "cursor-not-allowed bg-transparent text-live"
                : "cursor-not-allowed bg-divider text-muted"
              : "bg-accent text-accent-foreground hover:opacity-90"
          }`}
        >
          {onCooldown && (
            <span
              className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-live align-middle shadow-[var(--shadow-glow-live)]"
              aria-hidden="true"
            />
          )}
          {buttonLabel}
        </button>
      </div>
      {error && (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
