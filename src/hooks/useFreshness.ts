"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RefreshResponse =
  | {
      status: "ingested";
      cooldownMs: number;
      nextEligibleAt: string;
      lastIngestedAt: string | null;
      lastError: string | null;
    }
  | {
      status: "skipped-cooldown";
      cooldownMs: number;
      lastAttemptedAt: string;
      nextEligibleAt: string;
      cooldownRemainingMs: number;
      lastIngestedAt: string | null;
      lastError: string | null;
    }
  | {
      status: "error";
      message: string;
    };

interface FreshnessState {
  lastIngestedAt: string | null;
  lastError: string | null;
  cooldownRemainingMs: number;
  nextEligibleAt: string | null;
  isRefreshing: boolean;
  fetchError: string | null;
}

const TICK_MS = 1000;

export function useFreshness() {
  const [state, setState] = useState<FreshnessState>({
    lastIngestedAt: null,
    lastError: null,
    cooldownRemainingMs: 0,
    nextEligibleAt: null,
    isRefreshing: false,
    fetchError: null,
  });

  const nextEligibleAtRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isRefreshing: true, fetchError: null }));

    try {
      const res = await fetch("/api/refresh");
      const data: RefreshResponse = await res.json();

      if (data.status === "error") {
        setState((prev) => ({
          ...prev,
          isRefreshing: false,
          fetchError: data.message,
        }));
        return;
      }

      nextEligibleAtRef.current = data.nextEligibleAt;

      setState({
        lastIngestedAt: data.lastIngestedAt,
        lastError: data.lastError,
        cooldownRemainingMs:
          data.status === "skipped-cooldown" ? data.cooldownRemainingMs : 0,
        nextEligibleAt: data.nextEligibleAt,
        isRefreshing: false,
        fetchError: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isRefreshing: false,
        fetchError: err instanceof Error ? err.message : "Network error",
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextEligibleAt = nextEligibleAtRef.current;
      if (!nextEligibleAt) return;

      const remaining = new Date(nextEligibleAt).getTime() - Date.now();
      setState((prev) => ({
        ...prev,
        cooldownRemainingMs: Math.max(0, remaining),
      }));
    }, TICK_MS);

    return () => clearInterval(interval);
  }, []);

  return { ...state, refresh };
}
