# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

An all-play fantasy football standings app for a private ESPN Fantasy league
(league ID `33257291`, 2026 season, top 6 make playoffs, seeds 1–2 get a
bye). The league currently shows 12 teams (offseason roster) and is
expected to settle at 11 teams once the season starts — don't hardcode a
team count anywhere; derive it from the ESPN API response so the app works
correctly at either size (or any other size, if the league changes again).
Instead of showing each team's record against only its scheduled opponent,
the app computes an **all-play record**: each team's weekly score compared
against every other team's score. Three views: Week, Season Standings,
Playoff Bracket.

This is a proof of concept for a single family league — favor simple,
working solutions over speculative generality. The one exception: every
table includes a `league_id` column so a second league could be added later
without a schema rewrite.

Full context lives in `/docs`:
- `docs/all-play-standings-backlog.md` — product summary, resolved
  decisions, epics, sprint sequencing, full creative brief
- `docs/all-play-standings-user-stories.xlsx` — every story with acceptance
  criteria, in build order

Read the backlog doc before starting work if anything here is ambiguous —
it has the full reasoning behind each decision, not just the conclusion.

## Tech stack

- Next.js (App Router, TypeScript, Tailwind)
- Vercel Hobby (hosting + native cron)
- Supabase (Postgres)
- ESPN's unofficial fantasy JSON API, authenticated via `espn_s2` + `SWID`
  cookies (env vars — never hardcode or log these)

## Key decisions already made (don't re-litigate)

- All-play record is the sole basis for playoff seeding — not ESPN's real
  head-to-head record. H2H is not displayed anywhere in the app.
- Total points scored (season-to-date) is the tiebreaker when all-play
  records are equal.
- All-play results are computed on read, at request time. No
  `all_play_results` table — don't add one.
- No historical backfill. The app only tracks weeks from whenever it's
  launched forward.
- Open access — no auth/login gate on the app itself.
- Scheduling is a single Vercel Hobby cron (`vercel.json`), 1x/day
  overnight, plus a manual "Refresh now" endpoint for on-demand updates
  during game days. If the Vercel plan is upgraded to Pro, cron frequency
  may increase later — structure `vercel.json` so that's a small change,
  not a rework.
- Visual direction is "dark mode sports broadcast" (ESPN/NFL RedZone
  feel) — full creative brief (palette, type, layout, motion) is in the
  backlog doc. Build to it from the first pass on any UI story, don't
  build plain-then-restyle.

## What you're empowered to decide

Acceptance criteria in the user stories describe verifiable outcomes, not
implementations. Folder structure, exact function signatures/interfaces,
component structure, state management, bracket pairing convention,
caching strategy, and similar implementation calls are yours to make. Notes
in the user-stories sheet flag places I have a lean opinion, not a
requirement — use judgment.

## Conventions

- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`,
  `refactor:`, `test:`). Reference the story ID where relevant, e.g.
  `feat(C3): compute weekly all-play win/loss tally`.
- **Env vars:** anything secret (ESPN cookies, Supabase service key, cron
  shared secret) goes in env vars only — `.env.local` locally (gitignored),
  Vercel env vars in production. Keep `.env.example` current as new vars
  are introduced.
- **No `all_play_results` table** and **no auth system** — flag it to Mike
  if a story seems to need either; don't add either unilaterally.

## Testing against real ESPN data

The 2026 season is in preseason (or early season) for a while yet, so
`SEASON=2026` may return an in-progress week with all-zero scores and no
completed weeks — not useful for verifying scoring logic end-to-end. The
same league ID (`33257291`) has a completed 2025 season with real final
scores for every week. When a story needs verification against real,
nonzero, completed-week data (box scores, all-play calculations, season
standings, etc.), temporarily call the ESPN client with `season: 2025`
instead of reading `process.env.SEASON`, to get real data to check against
— then confirm the story also runs cleanly against the live 2026 season
before wrapping up. Also re-confirm the current 2026 team count each time
(see league size note above) since it may still be settling.

## Story wrap-up procedure

Work through user stories in the order listed in
`docs/all-play-standings-user-stories.xlsx` (that order is dependency-safe
— nothing depends on a later story). For every story:

1. **Implement** the story against its acceptance criteria.
2. **Code review** — review your own diff before calling it done: check it
   actually satisfies the acceptance criteria, matches the conventions
   above, and doesn't introduce unrelated changes.
3. **Check for errors** — lint/type-check, resolve anything surfaced.
4. **Run the build** — confirm it builds clean.
5. **Report manual checks to Mike** — after the above pass, give Mike a
   short list of anything he should verify himself (e.g., "confirm the
   dropdown shows all completed weeks," "spot-check Team X's record against
   ESPN's site"). If a story is fully machine-verifiable and there's
   nothing meaningful for a human to check, say so explicitly rather than
   omitting the step.
6. **Wait.** Do not commit or push. Stop and wait for Mike to explicitly
   say to commit. When he does, commit with a Conventional Commits message
   referencing the story ID.

Do not batch multiple stories into one commit unless Mike asks for that.
