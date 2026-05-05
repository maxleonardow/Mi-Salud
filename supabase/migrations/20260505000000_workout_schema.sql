-- =====================================================
-- WORKOUT MODULE: 8 tables for plan-driven training
-- =====================================================

-- Catalog: exercises
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  exercise_type text not null check (exercise_type in ('strength','cardio','mobility','plyometric')),
  muscle_groups text[] not null default '{}',
  equipment text[] not null default '{}',
  technique text,
  image_url text,
  image_prompt text,
  substitute_ids uuid[] not null default '{}',
  is_seed boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Catalog: workout plans (mesocycles)
create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default false,
  mesocycle_weeks int not null default 4,
  current_week int not null default 1,
  current_week_started_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only 1 active plan per user
create unique index workout_plans_one_active_per_user
  on public.workout_plans (user_id) where is_active = true;

-- Catalog: workout templates (Workout A, B, …)
create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  name text not null,
  position int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Catalog: exercises in a workout template
create table public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position int not null,
  prescribed_sets int not null,
  reps_min int not null,
  reps_max int not null,
  target_rpe int,
  rest_seconds int not null default 90,
  is_warmup boolean not null default false,
  superset_with_position int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Catalog: schedule (which template on which day)
create table public.plan_schedule_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  template_id uuid references public.workout_templates(id) on delete set null,
  activity_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_id, day_of_week)
);

-- Logs: workout sessions
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid references public.workout_templates(id) on delete set null,
  date date not null default current_date,
  status text not null default 'planned' check (status in ('planned','in_progress','completed','skipped')),
  started_at timestamptz,
  ended_at timestamptz,
  duration_min int,
  overall_rpe int check (overall_rpe between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_sessions_user_date on public.workout_sessions(user_id, date desc);

-- Logs: per-set
create table public.exercise_set_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  set_number int not null,
  reps int,
  weight_kg numeric,
  duration_sec int,
  rpe int check (rpe between 1 and 10),
  is_pr boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create index exercise_set_logs_pr_lookup
  on public.exercise_set_logs(user_id, exercise_id, weight_kg desc);

-- Catalog: daily tips
create table public.daily_tips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  category text not null check (category in ('sleep','stress','recovery','nutrition','mobility','supplement','other')),
  context text[] not null default '{}',
  title text not null,
  content text not null,
  priority int not null default 3 check (priority between 1 and 5),
  is_seed boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Logs: tip shown/done/skipped per day
create table public.daily_tip_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  tip_id uuid not null references public.daily_tips(id) on delete cascade,
  status text not null default 'shown' check (status in ('shown','done','skipped')),
  created_at timestamptz not null default now(),
  unique (user_id, date, tip_id)
);

-- =====================================================
-- RLS: enable + policies (user_id = auth.uid())
-- =====================================================

alter table public.exercises                    enable row level security;
alter table public.workout_plans                enable row level security;
alter table public.workout_templates            enable row level security;
alter table public.workout_template_exercises   enable row level security;
alter table public.plan_schedule_slots          enable row level security;
alter table public.workout_sessions             enable row level security;
alter table public.exercise_set_logs            enable row level security;
alter table public.daily_tips                   enable row level security;
alter table public.daily_tip_logs               enable row level security;

-- Identical policy set per user-scoped table
do $$
declare t text;
begin
  for t in
    select unnest(array[
      'exercises','workout_plans','workout_templates','workout_template_exercises',
      'plan_schedule_slots','workout_sessions','exercise_set_logs','daily_tip_logs'
    ])
  loop
    execute format('create policy "%1$s_select_own" on public.%1$s for select using (auth.uid() = user_id)', t);
    execute format('create policy "%1$s_insert_own" on public.%1$s for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "%1$s_update_own" on public.%1$s for update using (auth.uid() = user_id)', t);
    execute format('create policy "%1$s_delete_own" on public.%1$s for delete using (auth.uid() = user_id)', t);
  end loop;
end$$;

-- daily_tips is special: user_id can be NULL (system seed) — visible to ALL users
create policy "daily_tips_select_own_or_seed" on public.daily_tips
  for select using (auth.uid() = user_id or user_id is null);
create policy "daily_tips_insert_own" on public.daily_tips
  for insert with check (auth.uid() = user_id);
create policy "daily_tips_update_own" on public.daily_tips
  for update using (auth.uid() = user_id);
create policy "daily_tips_delete_own" on public.daily_tips
  for delete using (auth.uid() = user_id);

-- =====================================================
-- Triggers: updated_at on catalogs
-- =====================================================

create trigger exercises_set_updated_at                  before update on public.exercises                  for each row execute function public.tg_set_updated_at();
create trigger workout_plans_set_updated_at              before update on public.workout_plans              for each row execute function public.tg_set_updated_at();
create trigger workout_templates_set_updated_at          before update on public.workout_templates          for each row execute function public.tg_set_updated_at();
create trigger workout_template_exercises_set_updated_at before update on public.workout_template_exercises for each row execute function public.tg_set_updated_at();
create trigger plan_schedule_slots_set_updated_at        before update on public.plan_schedule_slots        for each row execute function public.tg_set_updated_at();
create trigger workout_sessions_set_updated_at           before update on public.workout_sessions           for each row execute function public.tg_set_updated_at();
create trigger daily_tips_set_updated_at                 before update on public.daily_tips                 for each row execute function public.tg_set_updated_at();
