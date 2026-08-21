# All-Play Fantasy Standings — Product Backlog (Finalized)

**Product Owner / Architect:** Claude
**Stakeholder / Developer:** You (executing via Claude Code + manual tasks)
**Status:** Finalized v2 — 2026-08-20

---

## 1. Project Summary

A mobile-first web app that pulls scores from a public ESPN Fantasy Football league (ID `33257291`, 2026 season, 11 teams, no divisions, top 6 make playoffs with top 2 earning a bye) and computes **all-play records** — where each team's weekly score is compared against every other team, not just their single scheduled opponent.

Three views:
1. **Week** — defaults to current week, dropdown to view any past week's all-play results.
2. **Season Standings** — cumulative all-play win/loss record, updating in real time as the current week's scores come in.
3. **Playoff Bracket** — projected bracket based on current all-play standings (top 6, seeds 1–2 bye).

Built as a proof of concept for a single family league, architected so it *could* later scale to multiple leagues/users without a rewrite.

---

## 2. Tech Stack Decisions

| Layer | Choice | Notes |
|---|---|---|
| Hosting/Frontend | Vercel (Next.js, Hobby plan) | Existing account |
| Database | Supabase (Postgres) | Existing account |
| Data source | ESPN's unofficial fantasy JSON API | Requires `espn_s2` + `SWID` cookies |
| Refresh mechanism | **Stale-while-revalidate + global cooldown** | Page loads and manual refresh both trigger a cooldown-gated ingestion check (~3 min window); no per-user limiting needed since there's no auth |
| Scheduling | **Vercel native cron (Hobby)** — fallback only | 1x/day overnight; safety net in case nobody visits the page, not the primary freshness mechanism anymore |
| All-play computation | **On-the-fly, computed on read** | No precomputed results table; simpler, fine at this scale |
| Access control | **Open — no auth/PIN gate** | Anyone with the link can view |

---

## 3. Resolved Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Scheduling | **Vercel Hobby native cron** — 1x/day overnight run via `vercel.json` cron config. No external scheduler needed. If you upgrade to Vercel Pro, cadence can increase to multiple times/day (Pro allows more frequent cron); revisit at that point |
| 2 | Playoff seeding | **All-play record**, not ESPN's real H2H record |
| 3 | Tiebreaker | **Total points scored** (season-to-date) when all-play records tie |
| 4 | H2H record display | **Not shown** — app is all-play only, no H2H comparison anywhere |
| 5 | Historical backfill | **Not needed** — app starts tracking fresh from whenever it's launched; no backfill of already-played 2026 weeks |
| 6 | Computation strategy | **Compute on read** — no `all_play_results` table needed |
| 7 | Access control | **Open to anyone with the URL** — no auth |
| 8 | Design approach | **Creative brief drafted now** (see Section 6) so Claude Code builds the real design in the first pass, not a plain-then-restyle approach |
| 9 | Refresh strategy *(added 2026-08-21)* | **Stale-while-revalidate with a shared global cooldown**, not per-page-load ESPN calls and not cron as the primary mechanism. A cooldown-gated check (C5) decides whether to hit ESPN, triggered by page loads and the manual refresh control (E6) alike. Cron (D1) becomes a fallback safety net. This replaces the standalone "Refresh now" endpoint story (D2) — see Section 4 |

---

## 4. Epics & User Stories (Updated)

### Epic A — Infrastructure Setup
- **A1. [You]** Create a new GitHub repository (e.g., `all-play-standings`).
- **A2. [You]** Create a new Vercel project (Hobby plan), link to the GitHub repo.
- **A3. [You]** Create a new Supabase project for this app.
- **A4. [Claude Code]** Scaffold Next.js app (App Router, TypeScript, Tailwind), ready to deploy, placeholder homepage.
- **A5. [You]** Retrieve `espn_s2` and `SWID` cookies, add as env vars in Vercel + local `.env.local`.
- **A6. [Claude Code]** Set up Supabase client library and env var wiring.

### Epic B — ESPN Data Integration
- **B1. [Claude Code]** ESPN API client: authenticate via cookies, fetch league metadata (teams, names/logos, current week, matchup schedule).
- **B2. [Claude Code]** Fetch box scores (weekly point totals per team) for a given week.
- **B3. [Claude Code]** Error handling for expired/invalid cookies — clear surfaced error, not a silent failure.

### Epic C — Database Schema & Data Pipeline
- **C1. [Claude Code]** Supabase schema: `leagues`, `teams`, `weekly_scores`. No `all_play_results` table — computed on read. Every table includes `league_id` for future multi-league support. Schema also tracks `last_ingested_at` / `last_attempted_at` to support the cooldown check in C5.
- **C2. [Claude Code]** Ingestion function: pulls current week's scores from ESPN, upserts into `weekly_scores`, and updates the timestamp columns from C1. Callable directly (not just as an HTTP route) so C5 and the cron fallback can both invoke it without an extra network hop.
- **C3. [Claude Code]** All-play calculation logic (runtime, not stored): for a given week, compare every team's score against every other team's, produce win/loss tally.
- **C4. [Claude Code]** Season-standings aggregation logic: sum all-play win/loss across all weeks played so far, including live in-progress current week. Apply points-scored tiebreaker when records are equal.
- **C5. [Claude Code]** *(new)* Cooldown-gated staleness check: shared function that decides whether to trigger C2, based on a global (not per-user) cooldown window (~3 min, tunable). This is the single gate used by page loads (E1–E3), the manual refresh control (E6), and optionally the cron fallback (D1) — no other code path should call C2 directly.

### Epic D — Scheduling
- **D1. [Claude Code]** Add a `vercel.json` cron config (1x/day, overnight) as a **fallback safety net** — not the primary refresh mechanism now that C5's stale-while-revalidate pattern handles normal traffic. Points at C2 (directly, or through C5 — Claude Code's call). Include a shared-secret header/env-var check on the route so it's not publicly triggerable.
- ~~D2~~ — **removed.** The standalone "Refresh now" endpoint is superseded by C5 (backend cooldown gate) + E6 (shared frontend control), which together cover the same need with less duplicated logic.

### Epic E — Frontend
- **E1. [Claude Code]** **Week tab**: defaults to current NFL week, dropdown for prior weeks, all-play win/loss table per team (e.g., 10-0 down to 0-10) plus actual score. Page load triggers the C5 staleness check so data auto-refreshes when stale.
- **E2. [Claude Code]** **Season Standings tab**: cumulative all-play record per team, sorted by win % then points-scored tiebreaker. Page load triggers C5 the same way as E1 — no separate live-polling mechanism needed.
- **E3. [Claude Code]** **Playoff Bracket tab**: bracket from current all-play standings — seeds 1–2 bye, seeds 3–6 fill in, all-play as sole seeding source. Same freshness pattern as E1/E2.
- **E4. [Claude Code]** Mobile-first responsive design across all three tabs.
- **E5. [Claude Code]** Visual design pass per creative brief in Section 6 below — built into the first pass, not bolted on later.
- **E6. [Claude Code]** *(new)* Shared "last updated" indicator + refresh control: single component/hook, used across all three tabs, that shows how long ago data was refreshed and lets the user trigger C5's cooldown-gated check on demand. Disables / shows a countdown if clicked during an active cooldown rather than silently no-op'ing.

### Epic F — Deployment & Polish
- **F1. [You]** Connect custom domain (optional) or confirm default Vercel URL.
- **F2. [Claude Code]** Loading/error states throughout (ESPN API down, cookies expired, ingestion failures, and the cooldown-blocked refresh state from E6).
- **F3. [Claude Code]** README: local dev setup, env vars, how to refresh ESPN cookies, how the cooldown/staleness mechanism (C5) works and how to tune its duration, and how the Vercel cron fallback works and how to adjust its cadence in `vercel.json` if you upgrade to Pro.

---

## 5. Sprint Sequencing

**Sprint 1 — Foundation ✅ Complete**
A1 → A2 → A3 → A4 → A5 → A6

**Sprint 2 — Data Layer ✅ Complete**
B1 → B2 → B3 → C1 → C2

**Sprint 3 — Core Logic** *(updated 2026-08-21)*
C3 → C4 → C5 (all-play + standings calculation, then the cooldown-gated staleness check — all unit-testable before any UI exists)

**Sprint 4 — Frontend Core** *(updated 2026-08-21)*
E6 → E1 → E2 → E3 (shared freshness/refresh component first, then the three tabs consume it — functional first, styled per brief as you build, not a separate restyle pass)

**Sprint 5 — Polish & Automation** *(updated 2026-08-21)*
E4 → E5 → D1 (cron is now a fallback safety net, not the primary refresh path — see Section 3, decision 9)

**Sprint 6 — Ship**
F1 → F2 → F3 → deploy

---

## 6. Creative Brief — "Dark Mode Sports Broadcast"

**Vibe:** ESPN/NFL RedZone broadcast graphics package, not a spreadsheet. Think scoreboard overlays, stat-bug lower thirds, draft-night stage lighting — rendered as a clean web app rather than literal broadcast chrome.

**Palette:**
- Near-black base (`#0A0E14` / `#0D1117` range), not pure black — keeps depth
- One saturated accent as the "broadcast" color — electric green, blood orange, or cyan work well against dark; pick one and use it hard for live/active states, scores, and CTAs
- Muted slate grays for secondary text and dividers
- Reserve a second accent (amber/gold) exclusively for "live" or "in progress" indicators so it reads as urgency, not decoration

**Typography:**
- Condensed, bold sans for scores and standings numbers (scoreboard feel) — e.g., a tight-tracking display face for big numbers
- Cleaner, more neutral sans for body/labels so numbers stay the visual focus
- Numerals should be tabular/monospaced where they're being compared in a column (all-play records, points)

**Layout cues:**
- Week tab: table rows should feel like a scoreboard ticker — team logo/name left, win-loss record and score right, subtle divider lines, not heavy borders
- Season Standings: leaderboard treatment — rank number large and bold, maybe a thin colored bar/sparkline indicating trend
- Playoff Bracket: literal bracket lines connecting seeds, bye slots visually distinct (grayed connector or "BYE" badge) from live matchups
- Live/current week gets a subtle pulsing dot or "LIVE" badge in the accent-gold color; past weeks look calmer/desaturated by comparison

**Motion (light touch, not gratuitous):**
- Score updates on the live week could tick/count up rather than snap, on refresh
- Standings reordering (if a team overtakes another mid-week) can animate the row swap

**What to avoid:**
- Generic SaaS dashboard look (rounded cards, pastel palette, Inter font at default weights everywhere)
- Overly literal ESPN branding/logo colors — this should feel *inspired by* broadcast design, not a trademark risk
- Cramming all three views into one screen on mobile — each tab should breathe

This brief goes to Claude Code alongside E1–E3 so the components are built with this direction from the start rather than retrofitted in E5.

---

## 7. Remaining Open Items

None blocking. Small things to handle inline during build, not upfront:
- Exact shared-secret mechanism for the Vercel cron → ingestion endpoint (simple header token is sufficient; Claude Code can propose it during D1).
- Exact NFL week boundary logic for "current week" (ESPN's API generally exposes this directly — B1 confirmed and used ESPN's own current-week value).
- Cooldown duration for C5 — 3 minutes is the suggested starting point; tune during D1/C5 if it feels too aggressive or too lax in practice. Should live as a single configurable value (e.g., env var) referenced by both C5 and E6, not hardcoded in multiple places.

**Note on freshness:** As of 2026-08-21, the primary freshness mechanism is stale-while-revalidate via C5, not the cron. The daily Vercel cron (D1) is now a fallback only, covering the edge case where nobody visits the page for an extended period.

**Next step:** Kick off Sprint 1 — hand Epic A to yourself/Claude Code.
