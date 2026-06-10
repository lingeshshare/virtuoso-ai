-- Virtuoso AI — Initial Schema
-- Run via: supabase db push  OR  paste into Supabase SQL editor

-- ─────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fuzzy text search later

-- ─────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  instrument    text,
  current_level text,
  target_level  text,
  onboarding_completed boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table profiles is 'One row per auth user. Created automatically on signup.';

-- Keep updated_at current
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure set_updated_at();

-- Auto-create a profile row when a new user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- RLS
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- ─────────────────────────────────────────
-- recordings
-- ─────────────────────────────────────────
create table if not exists recordings (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references profiles(id) on delete cascade,
  title             text not null default 'Untitled Recording',
  instrument        text not null,
  file_path         text,          -- storage path: {user_id}/{recordingId}/audio.ext
  file_url          text,          -- 24h signed URL (refreshed on read)
  duration_seconds  numeric(8,2),
  file_size_bytes   bigint,
  mime_type         text,
  status            text not null default 'uploading'
                      check (status in ('uploading','processing','analyzed','error')),
  error_message     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger recordings_updated_at
  before update on recordings
  for each row execute procedure set_updated_at();

create index idx_recordings_user_id   on recordings(user_id);
create index idx_recordings_status    on recordings(status);
create index idx_recordings_created   on recordings(created_at desc);

alter table recordings enable row level security;

create policy "Users can view own recordings"
  on recordings for select
  using (auth.uid() = user_id);

create policy "Users can insert own recordings"
  on recordings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own recordings"
  on recordings for update
  using (auth.uid() = user_id);

create policy "Users can delete own recordings"
  on recordings for delete
  using (auth.uid() = user_id);

-- Service role bypass (used by analysis pipeline)
create policy "Service role bypass recordings"
  on recordings for all
  using (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- audio_metrics
-- ─────────────────────────────────────────
create table if not exists audio_metrics (
  id              uuid primary key default uuid_generate_v4(),
  recording_id    uuid not null references recordings(id) on delete cascade,
  engine          text not null,   -- 'librosa' | 'crepe' | 'basic_pitch' | 'essentia'
  metrics_json    jsonb not null,  -- full structured metrics from the audio engine

  -- Flattened fast-access columns (denormalized from metrics_json by the analysis pipeline)
  tempo_bpm       numeric(7,2),
  avg_loudness_db numeric(7,2),
  onset_count     integer,
  pitch_accuracy  numeric(5,2),    -- 0–100
  intonation_score numeric(5,2),   -- 0–100
  timing_score    numeric(5,2),    -- 0–100
  dynamics_score  numeric(5,2),    -- 0–100

  created_at      timestamptz not null default now()
);

create index idx_audio_metrics_recording on audio_metrics(recording_id);

alter table audio_metrics enable row level security;

-- Users can read metrics for their own recordings
create policy "Users can view own audio metrics"
  on audio_metrics for select
  using (
    exists (
      select 1 from recordings r
      where r.id = audio_metrics.recording_id
        and r.user_id = auth.uid()
    )
  );

create policy "Service role bypass audio_metrics"
  on audio_metrics for all
  using (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- feedback_reports
-- ─────────────────────────────────────────
create table if not exists feedback_reports (
  id               uuid primary key default uuid_generate_v4(),
  recording_id     uuid not null references recordings(id) on delete cascade,
  user_id          uuid not null references profiles(id) on delete cascade,

  overall_score    numeric(5,2),   -- 0–100 weighted composite
  estimated_level  text,           -- 'beginner' | 'region' | 'all-state' | ...
  summary          text,           -- 2–3 sentence plain-text summary
  report_json      jsonb not null, -- full structured report (category scores, timestamps, gaps)
  persona          text not null default 'clinician',
  claude_model     text,
  input_tokens     integer,
  output_tokens    integer,

  created_at       timestamptz not null default now()
);

create index idx_feedback_reports_recording on feedback_reports(recording_id);
create index idx_feedback_reports_user      on feedback_reports(user_id);

alter table feedback_reports enable row level security;

create policy "Users can view own feedback"
  on feedback_reports for select
  using (auth.uid() = user_id);

create policy "Service role bypass feedback"
  on feedback_reports for all
  using (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- practice_plans
-- ─────────────────────────────────────────
create table if not exists practice_plans (
  id            uuid primary key default uuid_generate_v4(),
  recording_id  uuid references recordings(id) on delete set null,
  report_id     uuid references feedback_reports(id) on delete set null,
  user_id       uuid not null references profiles(id) on delete cascade,
  drills_json   jsonb not null,  -- array of PracticeItem objects
  total_minutes integer,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger practice_plans_updated_at
  before update on practice_plans
  for each row execute procedure set_updated_at();

create index idx_practice_plans_user      on practice_plans(user_id);
create index idx_practice_plans_recording on practice_plans(recording_id);

alter table practice_plans enable row level security;

create policy "Users can view own practice plans"
  on practice_plans for select
  using (auth.uid() = user_id);

create policy "Service role bypass practice_plans"
  on practice_plans for all
  using (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- reference_materials
-- ─────────────────────────────────────────
create table if not exists reference_materials (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles(id) on delete cascade,
  recording_id  uuid references recordings(id) on delete set null,
  type          text not null check (type in ('pdf','musicxml','midi','audition_packet','excerpt')),
  file_path     text not null,
  created_at    timestamptz not null default now()
);

create index idx_reference_materials_user      on reference_materials(user_id);
create index idx_reference_materials_recording on reference_materials(recording_id);

alter table reference_materials enable row level security;

create policy "Users can view own reference materials"
  on reference_materials for select
  using (auth.uid() = user_id);

create policy "Users can insert own reference materials"
  on reference_materials for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own reference materials"
  on reference_materials for delete
  using (auth.uid() = user_id);

create policy "Service role bypass reference_materials"
  on reference_materials for all
  using (auth.role() = 'service_role');
