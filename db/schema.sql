-- =========================================================
-- C1: leagues, teams, weekly_scores, ingestion_state
-- All-Play Fantasy Standings — POC schema
--
-- Single league today; league_id present everywhere for
-- future multi-league support. No RLS: service-role-only
-- server-side access, no end-user auth.
--
-- How to apply: paste this whole file into the Supabase
-- Dashboard SQL Editor (Project -> SQL Editor -> paste -> Run).
-- Safe to re-run: every object uses IF NOT EXISTS.
-- =========================================================

create table if not exists leagues (
  id                bigint generated always as identity primary key,
  espn_league_id    bigint not null,
  season            integer not null,
  name              text,
  current_week      integer,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint leagues_espn_league_id_season_key
    unique (espn_league_id, season)
);

comment on table leagues is
  'One row per (ESPN league, season). Other tables'' league_id references leagues.id, not the raw ESPN league ID.';
comment on column leagues.espn_league_id is
  'Raw ESPN league ID (e.g. 33257291). Not globally unique alone -- unique together with season.';
comment on column leagues.current_week is
  'ESPN''s currentMatchupPeriod as of the last successful ingestion. Weeks < current_week are completed; current_week itself is the live/in-progress week; weeks > current_week are future and should be excluded from standings and week selectors.';

alter table leagues add column if not exists current_week integer;

-- ---------------------------------------------------------

create table if not exists teams (
  id                bigint generated always as identity primary key,
  league_id         bigint not null references leagues(id) on delete cascade,
  espn_team_id      integer not null,
  name              text not null,
  abbrev            text not null,
  logo_url          text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint teams_league_id_espn_team_id_key
    unique (league_id, espn_team_id)
);

comment on table teams is
  'One row per team per league. espn_team_id is only unique within a league, hence the composite unique constraint (used as the ON CONFLICT target for upserts).';

create index if not exists teams_league_id_idx on teams (league_id);

-- ---------------------------------------------------------

create table if not exists weekly_scores (
  id                bigint generated always as identity primary key,
  league_id         bigint not null references leagues(id) on delete cascade,
  team_id           bigint not null references teams(id) on delete cascade,
  week              integer not null,
  total_points      numeric(7, 2) not null,
  is_completed      boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint weekly_scores_league_team_week_key
    unique (league_id, team_id, week),
  constraint weekly_scores_week_positive
    check (week > 0)
);

comment on table weekly_scores is
  'One row per team per week per league. Source of truth for all-play standings, computed on read -- never persisted.';

create index if not exists weekly_scores_league_week_idx
  on weekly_scores (league_id, week);
create index if not exists weekly_scores_team_id_idx
  on weekly_scores (team_id);

-- ---------------------------------------------------------

create table if not exists ingestion_state (
  id                  bigint generated always as identity primary key,
  league_id           bigint not null references leagues(id) on delete cascade,
  last_attempted_at   timestamptz,
  last_ingested_at    timestamptz,
  last_error          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint ingestion_state_league_id_key unique (league_id)
);

comment on table ingestion_state is
  'One row per league tracking ESPN ingestion attempts. last_attempted_at updates on every attempt (success or fail); last_ingested_at only on success. Read by the C5 cooldown check.';
