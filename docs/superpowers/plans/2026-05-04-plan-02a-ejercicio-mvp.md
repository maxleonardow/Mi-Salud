# Plan 2a — Ejercicio MVP

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Functional training tracker. User opens app, sees "Hoy: Full Body A", starts session, logs sets (weight × reps × RPE), gets PR detection 🏆, finishes session, browses history. Plan-driven (their personal Full Body 3x is pre-seeded).

**Out of scope (Plan 2b):** Gemini-generated images (placeholders for now), daily tips display, exercise/plan editing UI, compliance metric, library browse tab.

**Architecture:** New tables seeded with user's personal plan (Full Body 3x for hypertrophy beginner). Active session state managed via TanStack Query mutations + URL state. PR detection: client-side compute against historical max, persisted on save.

**Tech stack additions vs Plan 1:** None. Same Next.js 16 + Supabase + TanStack Query + shadcn.

**Spec reference:** `docs/superpowers/specs/2026-05-04-health-app-design.md` section 6.5 + section 7 (workout-related tables).

---

## File structure (new in this plan)

```
src/
├── app/
│   └── (app)/
│       └── mover/
│           ├── page.tsx                      # main /mover with tabs (rewrite)
│           ├── session/
│           │   └── [id]/page.tsx             # active session
│           └── history/
│               └── [id]/page.tsx             # past session detail
│
├── components/mover/
│   ├── today-banner.tsx                      # workout/activity of day
│   ├── workout-preview.tsx                   # exercise list preview
│   ├── plan-week-view.tsx                    # week grid
│   ├── session-list.tsx                      # history list
│   ├── set-input-row.tsx                     # 1 row per set
│   ├── rest-timer.tsx                        # countdown
│   ├── substitute-picker.tsx                 # modal
│   └── exercise-image-placeholder.tsx        # SVG placeholder until 2b
│
├── lib/mover/
│   ├── queries.ts                            # TanStack Query read hooks
│   ├── mutations.ts                          # TanStack Query write hooks
│   ├── compute-pr.ts                         # PR detection (TDD)
│   ├── today.ts                              # day-of-week → template (TDD)
│   └── seed-data.ts                          # user's plan + exercises + tips (data only, not executed)
│
└── types/database.types.ts                   # regenerate manually for new tables

supabase/migrations/
└── 20260505000000_workout_schema.sql        # 8 new tables + indexes + RLS

supabase/seed/
└── workout-seed.sql                          # 30 exercises + 1 plan + 2 templates + slots + 40 tips

tests/unit/mover/
├── compute-pr.test.ts
└── today.test.ts
```

---

### Task 1: Migration — workout schema (8 tables + RLS + indexes)

**Files:**
- Create: `supabase/migrations/20260505000000_workout_schema.sql`

- [ ] **Step 1: Write migration**

Full SQL (paste exactly):

```sql
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

-- Helper: identical policy set per user-scoped table
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
```

- [ ] **Step 2: Apply migration to remote (USER ACTION)**

The implementer subagent CANNOT apply the migration — it requires user to paste the SQL into Supabase Dashboard SQL Editor at https://supabase.com/dashboard/project/rfyddhiutlcewsaykval/sql/new and click Run.

Implementer should NOT attempt `supabase db push` (no CLI auth configured). Instead, implementer reports DONE and notes that user needs to apply the SQL.

- [ ] **Step 3: Commit migration file**

```bash
git add supabase/migrations/20260505000000_workout_schema.sql
git -c user.email='maximiliano.winkler@fahorro.com.mx' -c user.name='Maximiliano Winkler' commit -m "feat(db): add workout module schema (8 tables, RLS, indexes)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Update database.types.ts (manually for new tables)

**Files:**
- Modify: `src/types/database.types.ts`

- [ ] **Step 1: Append new table types**

Read current file. Add to the `Tables` object (don't break existing `profiles`):

```ts
exercises: {
  Row: {
    id: string;
    user_id: string;
    name: string;
    exercise_type: "strength" | "cardio" | "mobility" | "plyometric";
    muscle_groups: string[];
    equipment: string[];
    technique: string | null;
    image_url: string | null;
    image_prompt: string | null;
    substitute_ids: string[];
    is_seed: boolean;
    archived_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: { /* same fields, all but id/timestamps optional */ };
  Update: { /* all fields optional */ };
  Relationships: [];
};
workout_plans: {
  Row: {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    mesocycle_weeks: number;
    current_week: number;
    current_week_started_at: string;
    created_at: string;
    updated_at: string;
  };
  Insert: { /* same, optional */ };
  Update: { /* all optional */ };
  Relationships: [];
};
workout_templates: {
  Row: {
    id: string;
    user_id: string;
    plan_id: string;
    name: string;
    position: number;
    created_at: string;
    updated_at: string;
  };
  Insert: { /* … */ };
  Update: { /* … */ };
  Relationships: [];
};
workout_template_exercises: {
  Row: {
    id: string;
    user_id: string;
    template_id: string;
    exercise_id: string;
    position: number;
    prescribed_sets: number;
    reps_min: number;
    reps_max: number;
    target_rpe: number | null;
    rest_seconds: number;
    is_warmup: boolean;
    superset_with_position: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: { /* … */ };
  Update: { /* … */ };
  Relationships: [];
};
plan_schedule_slots: {
  Row: {
    id: string;
    user_id: string;
    plan_id: string;
    day_of_week: number;
    template_id: string | null;
    activity_label: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: { /* … */ };
  Update: { /* … */ };
  Relationships: [];
};
workout_sessions: {
  Row: {
    id: string;
    user_id: string;
    template_id: string | null;
    date: string;
    status: "planned" | "in_progress" | "completed" | "skipped";
    started_at: string | null;
    ended_at: string | null;
    duration_min: number | null;
    overall_rpe: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: { /* … */ };
  Update: { /* … */ };
  Relationships: [];
};
exercise_set_logs: {
  Row: {
    id: string;
    user_id: string;
    session_id: string;
    exercise_id: string;
    set_number: number;
    reps: number | null;
    weight_kg: number | null;
    duration_sec: number | null;
    rpe: number | null;
    is_pr: boolean;
    notes: string | null;
    created_at: string;
  };
  Insert: { /* … */ };
  Update: { /* … */ };
  Relationships: [];
};
daily_tips: {
  Row: {
    id: string;
    user_id: string | null;
    category: "sleep" | "stress" | "recovery" | "nutrition" | "mobility" | "supplement" | "other";
    context: string[];
    title: string;
    content: string;
    priority: number;
    is_seed: boolean;
    archived_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: { /* … */ };
  Update: { /* … */ };
  Relationships: [];
};
daily_tip_logs: {
  Row: {
    id: string;
    user_id: string;
    date: string;
    tip_id: string;
    status: "shown" | "done" | "skipped";
    created_at: string;
  };
  Insert: { /* … */ };
  Update: { /* … */ };
  Relationships: [];
};
```

The `/* … */` blocks must be filled out — reference the `profiles` table's pattern in the existing file. Each `Insert` makes everything except foreign keys/required-not-null optional; `Update` makes everything optional.

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/database.types.ts
git -c user.email='maximiliano.winkler@fahorro.com.mx' -c user.name='Maximiliano Winkler' commit -m "feat(types): add database types for workout schema

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Seed SQL — exercises + plan + templates + schedule + tips

**Files:**
- Create: `supabase/seed/workout-seed.sql`

User's plan: Full Body 3x for hypertrophy beginner (188cm, 70kg, 33yo). Designed to be applied once per user. Uses CTE to capture inserted UUIDs.

- [ ] **Step 1: Write seed**

Create `supabase/seed/workout-seed.sql`:

```sql
-- =====================================================
-- USER WORKOUT SEED
-- Designed for: Full Body 3x/sem, hypertrophy beginner
-- Run as authenticated user (uses auth.uid())
-- Idempotent guard: only runs if user has no exercises yet
-- =====================================================

do $$
declare
  v_user uuid := auth.uid();
  v_exists int;
  -- Exercise IDs (declared early so we can wire substitutes + templates)
  v_goblet_squat uuid;
  v_back_squat uuid;
  v_front_squat uuid;
  v_hack_squat uuid;
  v_leg_press uuid;
  v_deadlift uuid;
  v_rdl uuid;
  v_sumo_dl uuid;
  v_hip_thrust uuid;
  v_glute_bridge uuid;
  v_bench_db uuid;
  v_bench_bb uuid;
  v_pushup uuid;
  v_incline_bench_db uuid;
  v_incline_bench_bb uuid;
  v_ohp_db_seated uuid;
  v_ohp_bb uuid;
  v_arnold_press uuid;
  v_lateral_raise_db uuid;
  v_cable_lateral uuid;
  v_face_pull uuid;
  v_rear_fly_db uuid;
  v_lat_pulldown uuid;
  v_pullup uuid;
  v_chinup uuid;
  v_db_row uuid;
  v_bb_row uuid;
  v_tbar_row uuid;
  v_curl_db uuid;
  v_hammer_curl uuid;
  v_tricep_pushdown uuid;
  v_skull_crusher uuid;
  -- Plan + templates
  v_plan uuid;
  v_template_a uuid;
  v_template_b uuid;
begin
  if v_user is null then
    raise exception 'Must be authenticated to seed workout data';
  end if;

  select count(*) into v_exists from public.exercises where user_id = v_user;
  if v_exists > 0 then
    raise notice 'User already has exercises seeded; skipping';
    return;
  end if;

  -- ===== EXERCISES =====
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Goblet Squat',                  'strength', '{quads,glutes,core}',           '{dumbbell}',                'Mancuerna pegada al pecho con ambas manos. Pies a ancho de hombros, puntas ligero afuera. Bajar manteniendo torso erguido, codos por dentro de las rodillas en el fondo.',                              true) returning id into v_goblet_squat;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Sentadilla con Barra',          'strength', '{quads,glutes,hamstrings,core}','{barbell,rack}',            'Barra apoyada en trapecio (high bar). Pies a ancho de hombros. Bajar como si te sentaras hacia atrás, mantén pecho arriba, rodillas siguiendo línea de pies. Profundidad: cadera bajo paralelo.', true) returning id into v_back_squat;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Front Squat',                   'strength', '{quads,core}',                  '{barbell,rack}',            'Barra al frente apoyada en deltoides anterior, codos altos. Más demanda en cuádriceps y core que sentadilla trasera.',                                                                              true) returning id into v_front_squat;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Hack Squat',                    'strength', '{quads,glutes}',                '{machine}',                 'Máquina con respaldo a 45°. Pies altos = más glúteo, pies abajo = más cuádriceps.',                                                                                                                  true) returning id into v_hack_squat;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Leg Press',                     'strength', '{quads,glutes,hamstrings}',     '{machine}',                 'Espalda baja PEGADA al respaldo siempre (sino daño lumbar). No bloquees rodillas arriba.',                                                                                                            true) returning id into v_leg_press;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Peso Muerto Convencional',      'strength', '{hamstrings,glutes,back,core}', '{barbell}',                 'Barra sobre medio del pie. Cadera arriba, espalda neutra, hombros sobre barra. Empujar piso con pies, NO jalar la barra. Cadera y hombros suben juntos.',                                          true) returning id into v_deadlift;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Romanian Deadlift (RDL)',       'strength', '{hamstrings,glutes,back}',      '{dumbbell,barbell}',        'Rodillas ligeramente flexionadas (no se mueven más). Empujar cadera ATRÁS, no doblar rodillas. Espalda neutra. Sentirás estiramiento en isquios.',                                                  true) returning id into v_rdl;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Sumo Deadlift',                 'strength', '{quads,glutes,hamstrings}',     '{barbell}',                 'Pies muy abiertos, puntas afuera. Manos dentro de las rodillas. Más cuádriceps, menos espalda baja que convencional.',                                                                              true) returning id into v_sumo_dl;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Hip Thrust con Mancuerna',      'strength', '{glutes,hamstrings}',           '{dumbbell,bench}',          'Espalda alta apoyada en banco, mancuerna sobre cadera. Empuja con talones, contrae glúteo arriba 1 segundo.',                                                                                       true) returning id into v_hip_thrust;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Glute Bridge',                  'strength', '{glutes}',                      '{bodyweight}',              'Acostado, rodillas dobladas, pies en piso. Empuja con talones, contrae glúteo arriba.',                                                                                                              true) returning id into v_glute_bridge;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Press Banca con Mancuernas',    'strength', '{chest,shoulders,triceps}',     '{dumbbell,bench}',          'Mancuernas a los lados del pecho, codos a ~45° (no 90°). Bajar controlado, empujar fuerte. Mejor ROM y más seguro que barra para principiante.',                                                    true) returning id into v_bench_db;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Press Banca con Barra',         'strength', '{chest,shoulders,triceps}',     '{barbell,bench,rack}',      'Barra al medio del pecho, codos a 45°. Pies firmes en el piso. Siempre con observador o en rack con seguros.',                                                                                       true) returning id into v_bench_bb;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Push-ups',                      'strength', '{chest,shoulders,triceps,core}','{bodyweight}',              'Manos a ancho de hombros. Cuerpo recto como tabla. Bajar pecho hasta cerca del piso. Eleva pies en banco para hacer más difícil.',                                                                  true) returning id into v_pushup;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Press Banca Inclinado Mancuernas','strength', '{chest,shoulders,triceps}',   '{dumbbell,bench}',          'Banco a 30-45°. Énfasis en pecho superior. Mancuernas más perdonadoras que barra inclinada.',                                                                                                        true) returning id into v_incline_bench_db;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Press Banca Inclinado Barra',   'strength', '{chest,shoulders,triceps}',     '{barbell,bench,rack}',      'Banco a 30°. Más estable que mancuernas, más peso posible.',                                                                                                                                          true) returning id into v_incline_bench_bb;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Press Militar Mancuernas Sentado','strength', '{shoulders,triceps,core}',    '{dumbbell,bench}',          'Sentado en banco a 90° (apoya espalda). Mancuernas a la altura de los hombros, palmas adelante. Empuja arriba sin arquear espalda.',                                                                true) returning id into v_ohp_db_seated;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Press Militar con Barra (OHP)', 'strength', '{shoulders,triceps,core}',      '{barbell,rack}',            'De pie, barra a la altura de la clavícula. Aprieta glúteos y core. Empuja arriba, mete cabeza adelante al final.',                                                                                  true) returning id into v_ohp_bb;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Arnold Press',                  'strength', '{shoulders,triceps}',           '{dumbbell,bench}',          'Sentado. Mancuernas al frente con palmas hacia ti, rotar a palmas adelante mientras empujas arriba.',                                                                                                true) returning id into v_arnold_press;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Lateral Raise con Mancuernas',  'strength', '{shoulders}',                   '{dumbbell}',                'Mancuernas a los lados. Sube los brazos hasta la altura de los hombros, codo ligeramente flexionado. Sin balanceo.',                                                                                true) returning id into v_lateral_raise_db;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Cable Lateral Raise',           'strength', '{shoulders}',                   '{cable}',                   'Polea baja, cable cruza por delante del cuerpo. Más tensión constante que mancuerna.',                                                                                                                true) returning id into v_cable_lateral;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Face Pull',                     'strength', '{rear_delts,traps,upper_back}', '{cable}',                   'Polea alta con cuerda. Jalar a la cara, codos altos, separar las cuerdas a los lados de la cara. Crítico para postura encorvada.',                                                                   true) returning id into v_face_pull;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Reverse Fly Mancuernas',        'strength', '{rear_delts,upper_back}',       '{dumbbell,bench}',          'Inclinado en banco a 45°, mancuernas colgando. Abre brazos a los lados manteniendo codos ligeramente flexionados.',                                                                                  true) returning id into v_rear_fly_db;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Jalón al Pecho (Lat Pulldown)', 'strength', '{lats,biceps,upper_back}',      '{cable}',                   'Polea alta con barra. Sentado, jalar barra al pecho superior. Pecho arriba, codos hacia abajo y atrás.',                                                                                            true) returning id into v_lat_pulldown;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Pull-up',                       'strength', '{lats,biceps,upper_back}',      '{pullup_bar}',              'Agarre prono, manos a ancho de hombros o un poco más. Subir hasta que la barbilla pase la barra. Control en bajada.',                                                                                true) returning id into v_pullup;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Chin-up',                       'strength', '{biceps,lats}',                 '{pullup_bar}',              'Agarre supino (palmas hacia ti). Más fácil que pull-up, más bíceps.',                                                                                                                                 true) returning id into v_chinup;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Remo con Mancuerna 1 Brazo',    'strength', '{lats,upper_back,biceps}',      '{dumbbell,bench}',          'Una rodilla y mano en banco. Espalda paralela al piso. Jalar mancuerna al ombligo, codo cerca del cuerpo. No rotar torso.',                                                                          true) returning id into v_db_row;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Remo con Barra Inclinado',      'strength', '{lats,upper_back,biceps,core}', '{barbell}',                 'Inclinado al frente ~45°, espalda neutra. Jalar barra al ombligo. Más tasa pero más demanda lumbar.',                                                                                                true) returning id into v_bb_row;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'T-Bar Row',                     'strength', '{lats,upper_back}',             '{barbell,landmine}',        'Una punta de barra fija, jalar el otro extremo con triángulo. Buena alternativa al remo barra para espalda media.',                                                                                  true) returning id into v_tbar_row;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Curl Mancuernas Alternados',    'strength', '{biceps}',                      '{dumbbell}',                'De pie, mancuernas a los lados, palmas hacia adelante. Curlear una mancuerna a la vez sin balancear el cuerpo.',                                                                                    true) returning id into v_curl_db;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Hammer Curl',                   'strength', '{biceps,forearms}',             '{dumbbell}',                'Igual que curl pero con palmas hacia adentro (martillo). Más braquial, antebrazo, y se siente más fuerte.',                                                                                          true) returning id into v_hammer_curl;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Tríceps Push-down Cable',       'strength', '{triceps}',                     '{cable}',                   'Polea alta con cuerda o barra. Codos pegados al cuerpo. Empuja cable abajo extendiendo solo el codo.',                                                                                                true) returning id into v_tricep_pushdown;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Skull Crusher (Tricep Extension)','strength', '{triceps}',                   '{dumbbell,bench}',          'Acostado en banco, mancuernas arriba. Bajar SOLO con los codos hasta la frente, mantén codos quietos. Subir extendiendo.',                                                                          true) returning id into v_skull_crusher;

  -- ===== SUBSTITUTES (update substitute_ids) =====
  update public.exercises set substitute_ids = array[v_front_squat, v_hack_squat, v_leg_press, v_goblet_squat]::uuid[]
    where id = v_back_squat;
  update public.exercises set substitute_ids = array[v_back_squat, v_hack_squat]::uuid[]
    where id = v_front_squat;
  update public.exercises set substitute_ids = array[v_back_squat, v_front_squat]::uuid[]
    where id = v_hack_squat;
  update public.exercises set substitute_ids = array[v_back_squat, v_hack_squat]::uuid[]
    where id = v_leg_press;
  update public.exercises set substitute_ids = array[v_back_squat, v_leg_press]::uuid[]
    where id = v_goblet_squat;
  update public.exercises set substitute_ids = array[v_rdl, v_sumo_dl]::uuid[]
    where id = v_deadlift;
  update public.exercises set substitute_ids = array[v_deadlift, v_hip_thrust]::uuid[]
    where id = v_rdl;
  update public.exercises set substitute_ids = array[v_deadlift]::uuid[]
    where id = v_sumo_dl;
  update public.exercises set substitute_ids = array[v_glute_bridge, v_rdl]::uuid[]
    where id = v_hip_thrust;
  update public.exercises set substitute_ids = array[v_hip_thrust]::uuid[]
    where id = v_glute_bridge;
  update public.exercises set substitute_ids = array[v_bench_bb, v_pushup, v_incline_bench_db]::uuid[]
    where id = v_bench_db;
  update public.exercises set substitute_ids = array[v_bench_db, v_pushup]::uuid[]
    where id = v_bench_bb;
  update public.exercises set substitute_ids = array[v_bench_db, v_bench_bb]::uuid[]
    where id = v_pushup;
  update public.exercises set substitute_ids = array[v_incline_bench_bb, v_bench_db]::uuid[]
    where id = v_incline_bench_db;
  update public.exercises set substitute_ids = array[v_incline_bench_db, v_bench_bb]::uuid[]
    where id = v_incline_bench_bb;
  update public.exercises set substitute_ids = array[v_ohp_bb, v_arnold_press, v_lateral_raise_db]::uuid[]
    where id = v_ohp_db_seated;
  update public.exercises set substitute_ids = array[v_ohp_db_seated, v_arnold_press]::uuid[]
    where id = v_ohp_bb;
  update public.exercises set substitute_ids = array[v_ohp_db_seated, v_ohp_bb]::uuid[]
    where id = v_arnold_press;
  update public.exercises set substitute_ids = array[v_cable_lateral]::uuid[]
    where id = v_lateral_raise_db;
  update public.exercises set substitute_ids = array[v_lateral_raise_db]::uuid[]
    where id = v_cable_lateral;
  update public.exercises set substitute_ids = array[v_rear_fly_db]::uuid[]
    where id = v_face_pull;
  update public.exercises set substitute_ids = array[v_face_pull]::uuid[]
    where id = v_rear_fly_db;
  update public.exercises set substitute_ids = array[v_pullup, v_chinup]::uuid[]
    where id = v_lat_pulldown;
  update public.exercises set substitute_ids = array[v_lat_pulldown, v_chinup]::uuid[]
    where id = v_pullup;
  update public.exercises set substitute_ids = array[v_pullup, v_lat_pulldown]::uuid[]
    where id = v_chinup;
  update public.exercises set substitute_ids = array[v_bb_row, v_tbar_row]::uuid[]
    where id = v_db_row;
  update public.exercises set substitute_ids = array[v_db_row, v_tbar_row]::uuid[]
    where id = v_bb_row;
  update public.exercises set substitute_ids = array[v_db_row, v_bb_row]::uuid[]
    where id = v_tbar_row;
  update public.exercises set substitute_ids = array[v_hammer_curl]::uuid[]
    where id = v_curl_db;
  update public.exercises set substitute_ids = array[v_curl_db]::uuid[]
    where id = v_hammer_curl;
  update public.exercises set substitute_ids = array[v_skull_crusher]::uuid[]
    where id = v_tricep_pushdown;
  update public.exercises set substitute_ids = array[v_tricep_pushdown]::uuid[]
    where id = v_skull_crusher;

  -- ===== PLAN =====
  insert into public.workout_plans (user_id, name, description, is_active, mesocycle_weeks, current_week)
  values (v_user, 'Full Body 3x — Mes 1', 'Programa para hipertrofia + fuerza beginner. 3 sesiones/semana (Lun/Mié/Sáb) + tenis Mar/Jue. Mesociclo de 4 semanas con deload en W4.', true, 4, 1)
  returning id into v_plan;

  -- ===== TEMPLATES =====
  insert into public.workout_templates (user_id, plan_id, name, position) values
    (v_user, v_plan, 'Full Body A — Squat focus', 1) returning id into v_template_a;
  insert into public.workout_templates (user_id, plan_id, name, position) values
    (v_user, v_plan, 'Full Body B — Deadlift focus', 2) returning id into v_template_b;

  -- ===== TEMPLATE A EXERCISES =====
  insert into public.workout_template_exercises (user_id, template_id, exercise_id, position, prescribed_sets, reps_min, reps_max, target_rpe, rest_seconds, is_warmup, notes) values
    (v_user, v_template_a, v_goblet_squat,    1, 2, 10, 10, 6, 60,  true,  'Calentamiento de movimiento — peso ligero'),
    (v_user, v_template_a, v_back_squat,      2, 3, 5,  5,  8, 180, false, 'Compound principal del día'),
    (v_user, v_template_a, v_bench_db,        3, 3, 8,  8,  7, 120, false, NULL),
    (v_user, v_template_a, v_db_row,          4, 3, 10, 10, 7, 90,  false, '10 reps por brazo'),
    (v_user, v_template_a, v_ohp_db_seated,   5, 2, 10, 10, 7, 90,  false, NULL),
    (v_user, v_template_a, v_face_pull,       6, 3, 15, 15, 6, 60,  false, 'Superset con press militar'),
    (v_user, v_template_a, v_curl_db,         7, 2, 12, 12, 7, 60,  false, NULL);

  update public.workout_template_exercises set superset_with_position = 5
    where template_id = v_template_a and position = 6;

  -- ===== TEMPLATE B EXERCISES =====
  insert into public.workout_template_exercises (user_id, template_id, exercise_id, position, prescribed_sets, reps_min, reps_max, target_rpe, rest_seconds, is_warmup, notes) values
    (v_user, v_template_b, v_rdl,             1, 2, 10, 10, 6, 60,  true,  'Calentamiento del patrón hip hinge'),
    (v_user, v_template_b, v_deadlift,        2, 3, 3,  3,  8, 180, false, 'Compound principal del día'),
    (v_user, v_template_b, v_incline_bench_db,3, 3, 8,  8,  7, 120, false, NULL),
    (v_user, v_template_b, v_lat_pulldown,    4, 3, 10, 10, 7, 90,  false, 'Camino a dominadas'),
    (v_user, v_template_b, v_hip_thrust,      5, 3, 12, 12, 7, 90,  false, NULL),
    (v_user, v_template_b, v_lateral_raise_db,6, 3, 12, 12, 6, 60,  false, 'Superset con hip thrust'),
    (v_user, v_template_b, v_tricep_pushdown, 7, 3, 12, 12, 7, 60,  false, NULL);

  update public.workout_template_exercises set superset_with_position = 5
    where template_id = v_template_b and position = 6;

  -- ===== SCHEDULE: Lun A, Mar Tenis, Mié B, Jue Tenis, Vie Descanso, Sáb A, Dom Descanso =====
  -- day_of_week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  insert into public.plan_schedule_slots (user_id, plan_id, day_of_week, template_id, activity_label) values
    (v_user, v_plan, 1, v_template_a, NULL),
    (v_user, v_plan, 2, NULL,         'Tenis 🎾'),
    (v_user, v_plan, 3, v_template_b, NULL),
    (v_user, v_plan, 4, NULL,         'Tenis 🎾'),
    (v_user, v_plan, 5, NULL,         'Descanso 😴'),
    (v_user, v_plan, 6, v_template_a, NULL),
    (v_user, v_plan, 0, NULL,         'Descanso 😴');

  raise notice 'Workout seed complete: 32 exercises, 1 plan, 2 templates, 7 schedule slots';
end$$;

-- =====================================================
-- DAILY TIPS — system seed (user_id = NULL, visible to all)
-- =====================================================

insert into public.daily_tips (user_id, category, title, content, priority, is_seed) values
  -- Sleep (8)
  (NULL, 'sleep', 'Sol AM 10 min', 'Sal al exterior 10 minutos en la primera hora de despertar. Sin lentes oscuros, sin ventana de por medio. Ancla tu ritmo circadiano y mejora tu sueño esa misma noche.', 5, true),
  (NULL, 'sleep', 'Lights out 22:30 fijo', 'Apaga todas las luces principales a las 22:30 — incluso fines de semana. La consistencia del horario importa más que las horas totales.', 5, true),
  (NULL, 'sleep', 'Cuarto fresco 18°C', 'Tu cuerpo necesita bajar 1-2°C de temperatura central para dormir profundo. Ajusta AC o ventilador.', 4, true),
  (NULL, 'sleep', 'Cero pantallas 1h antes', 'Sin teléfono, TV, laptop al menos 60 min antes de dormir. Lee un libro físico o haz estiramientos.', 4, true),
  (NULL, 'sleep', 'Cero café después de las 12 PM', 'La cafeína tiene una vida media de 5-6 horas. Un café a las 3 PM = 50mg en tu sistema a las 9 PM.', 4, true),
  (NULL, 'sleep', 'Cena 3h antes de dormir', 'Termina de cenar 3 horas antes de acostarte para que la digestión no interfiera con el sueño profundo.', 3, true),
  (NULL, 'sleep', 'Magnesio glicinato pre-sueño', 'Toma tu magnesio glicinato 30 min antes de dormir — calma sistema nervioso y mejora sueño profundo.', 4, true),
  (NULL, 'sleep', 'Cobija pesada', 'Si tienes una cobija pesada (5-7kg), úsala. La presión gentil reduce ansiedad y mejora calidad de sueño.', 2, true),
  -- Stress (8)
  (NULL, 'stress', 'Respiración 4-7-8 antes de dormir', 'Inhala 4s, retén 7s, exhala 8s. Repite 4 ciclos. Activa parasimpático, baja cortisol.', 5, true),
  (NULL, 'stress', 'Box breathing en pausas', 'Inhala 4s, retén 4s, exhala 4s, retén 4s. 5 minutos a media mañana baja estrés notablemente.', 4, true),
  (NULL, 'stress', 'Caminata sin teléfono post-comida', '15 min de caminata después de cualquier comida — ayuda digestión + glucosa + cabeza.', 4, true),
  (NULL, 'stress', 'Cold exposure 30 seg ducha', 'Termina tu ducha con 30 segundos de agua fría. Aumenta noradrenalina y resiliencia al estrés.', 3, true),
  (NULL, 'stress', 'Journaling 5 min AM', '5 minutos escribiendo lo que pasa por tu mente al despertar. Vacía la cabeza para empezar el día.', 3, true),
  (NULL, 'stress', 'Cero noticias antes de las 10 AM', 'Las primeras 2 horas del día son las más sensibles a información. Protege tu mañana de doom-scrolling.', 4, true),
  (NULL, 'stress', 'Meditación guiada 10 min', 'Calm o Headspace por 10 min. Entrena el músculo de la atención.', 3, true),
  (NULL, 'stress', 'Sauna 15 min', 'Si tienes acceso, sauna 15-20 min 3x/sem reduce cortisol crónico y mejora cardiovascular.', 3, true),
  -- Recovery (8)
  (NULL, 'recovery', 'Foam rolling 5 min post-entreno', 'Pasa el foam roller por cuádriceps, isquios, espalda alta — 30 seg cada zona. Reduce dolor del día siguiente.', 4, true),
  (NULL, 'recovery', 'Estiramiento estático 10 min', 'Después del entreno, estira los músculos trabajados 30 seg cada uno. Mejora movilidad sin afectar fuerza.', 4, true),
  (NULL, 'recovery', 'Caminata Z2 30 min día de descanso', 'En tus días sin gym, una caminata fácil de 30 min mejora recovery activo y NO interfiere con ganancias.', 4, true),
  (NULL, 'recovery', 'Hidratación: 35ml × kg', 'Tu mínimo diario = 35ml × tu peso en kg. Suma 500ml extra por cada hora de entrenamiento.', 5, true),
  (NULL, 'recovery', 'Ducha contraste post-leg-day', 'Después de día pesado de pierna: 3 ciclos de 1 min caliente / 30 seg frío. Reduce inflamación y dolor.', 3, true),
  (NULL, 'recovery', 'Día completo de descanso post-pierna', 'No programes cardio intenso 24h después de squat o deadlift pesado. Tus piernas necesitan reparar.', 4, true),
  (NULL, 'recovery', '90/90 hip stretch 2 min/lado', 'Sentado en piso, una pierna a 90° adelante, otra a 90° al lado. Inclínate sobre la del frente. Cadera más libre = mejor squat.', 4, true),
  (NULL, 'recovery', 'Worlds greatest stretch AM', 'Lunge + rotación de torso + brazo arriba. 5 reps por lado. Movilidad full body en 2 minutos.', 3, true),
  -- Nutrition (8)
  (NULL, 'nutrition', '30g proteína en primera comida', 'Tu primera comida debe tener 30g+ de proteína. Esto activa síntesis muscular para todo el día.', 5, true),
  (NULL, 'nutrition', 'Vaso de agua antes de cada comida', 'Te hidrata + ayuda a controlar el hambre. Si estás bulkeando: tómalo 30 min antes para no llenar el estómago.', 4, true),
  (NULL, 'nutrition', 'Sin azúcar añadido', 'Lee etiquetas: cualquier ingrediente que termine en -osa (glucosa, sacarosa, fructosa) cuenta. La fruta entera está bien.', 4, true),
  (NULL, 'nutrition', 'Batido líquido entre comidas', 'Cuando no llegues a calorías: 1 scoop whey + 1 plátano + 2 cdas mantequilla cacahuate + 300ml leche entera = 600 kcal en 200ml.', 5, true),
  (NULL, 'nutrition', 'Aceite de oliva, no aceite vegetal', 'Cocina con aceite de oliva o coco. Evita canola, soja, maíz — son altos en omega-6 inflamatorio.', 3, true),
  (NULL, 'nutrition', 'Plato 50/25/25', '50% verduras + 25% proteína + 25% carbo en cada comida principal. Simple, balanceado, sostenible.', 3, true),
  (NULL, 'nutrition', 'Frutos secos como snack', 'Un puñado (30g) de almendras o nueces = 200 kcal de calidad. Buen snack para hardgainer.', 3, true),
  (NULL, 'nutrition', 'Comer dentro de 30-60 min post-entreno', 'Ventana óptima para reponer glucógeno y maximizar síntesis proteica. Whey + carbo simple ideal.', 4, true),
  -- Mobility (4)
  (NULL, 'mobility', 'Doorway pec stretch', 'Brazo en marco de puerta a 90°, gira el cuerpo lejos. 30 seg cada lado. Anti-postura encorvada.', 4, true),
  (NULL, 'mobility', 'Thoracic extension foam roller', 'Foam roller bajo espalda alta, manos detrás de cabeza. Extiende sobre el roller. 5-10 reps.', 3, true),
  (NULL, 'mobility', 'Wall slides para hombros', 'Espalda contra pared, brazos en W contra la pared. Desliza arriba a Y. 10 reps. Movilidad de hombro.', 3, true),
  (NULL, 'mobility', 'Hip flexor stretch', 'Lunge profundo, cadera adelante, glúteo apretado. 30 seg cada lado. Contra el hip tightness de oficina.', 4, true),
  -- Supplement (4)
  (NULL, 'supplement', 'Creatina 5g diarios', 'Cualquier momento del día, con agua. NO requiere "loading phase". Saturas en 4 semanas con dosis constante.', 5, true),
  (NULL, 'supplement', 'Whey post-entreno', 'Toma tu whey en los 30-60 min post-entreno para máxima síntesis muscular. 25g = 1 scoop.', 4, true),
  (NULL, 'supplement', 'Vitamina D3 + K2 con grasa', 'Es liposoluble. Tómala con tu comida más grasa del día (huevos AM, aguacate, salmón) para mejor absorción.', 4, true),
  (NULL, 'supplement', 'Omega 3 con comida', 'Nunca en ayunas. Con comida para mejor absorción. 2g EPA/DHA/día reduce inflamación sistémica.', 4, true);
```

- [ ] **Step 2: Apply seed (USER ACTION)**

User pastes this into Supabase SQL Editor (https://supabase.com/dashboard/project/rfyddhiutlcewsaykval/sql/new), runs it. The CREATE TABLE part already ran in Task 1; this only inserts seed data.

Implementer reports DONE and notes user action. (We'll add a UI button later in Plan 2b for re-seeding if needed.)

- [ ] **Step 3: Commit**

```bash
git add supabase/seed/workout-seed.sql
git -c user.email='maximiliano.winkler@fahorro.com.mx' -c user.name='Maximiliano Winkler' commit -m "feat(seed): add user's Full Body 3x plan + 32 exercises + 40 daily tips

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Today logic (TDD) — `src/lib/mover/today.ts`

**Files:**
- Create: `src/lib/mover/today.ts`
- Create: `tests/unit/mover/today.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { dayOfWeek, findScheduleSlotForToday, type ScheduleSlot } from "@/lib/mover/today";

describe("today helpers", () => {
  it("dayOfWeek returns 0-6 in Sun-Sat order matching JS Date", () => {
    expect(dayOfWeek(new Date("2026-05-04"))).toBe(1); // Monday
    expect(dayOfWeek(new Date("2026-05-05"))).toBe(2); // Tuesday
    expect(dayOfWeek(new Date("2026-05-10"))).toBe(0); // Sunday
  });

  it("findScheduleSlotForToday returns the slot whose day_of_week matches", () => {
    const slots: ScheduleSlot[] = [
      { day_of_week: 1, template_id: "t-A", activity_label: null },
      { day_of_week: 2, template_id: null, activity_label: "Tenis 🎾" },
      { day_of_week: 3, template_id: "t-B", activity_label: null },
    ];
    const result = findScheduleSlotForToday(slots, new Date("2026-05-04")); // Mon
    expect(result?.template_id).toBe("t-A");
    const tueResult = findScheduleSlotForToday(slots, new Date("2026-05-05"));
    expect(tueResult?.activity_label).toBe("Tenis 🎾");
  });

  it("findScheduleSlotForToday returns undefined when no slot matches", () => {
    const slots: ScheduleSlot[] = [{ day_of_week: 1, template_id: "t-A", activity_label: null }];
    expect(findScheduleSlotForToday(slots, new Date("2026-05-05"))).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

```bash
pnpm test
```

- [ ] **Step 3: Implement**

```ts
// src/lib/mover/today.ts
export type ScheduleSlot = {
  day_of_week: number;
  template_id: string | null;
  activity_label: string | null;
};

export function dayOfWeek(date: Date): number {
  return date.getDay();
}

export function findScheduleSlotForToday<T extends ScheduleSlot>(
  slots: T[],
  date: Date = new Date()
): T | undefined {
  const dow = dayOfWeek(date);
  return slots.find(s => s.day_of_week === dow);
}
```

- [ ] **Step 4: Run test, expect PASS**

```bash
pnpm test
```

Expected: 3 new tests pass (alongside existing nav tests = 6 total).

- [ ] **Step 5: Commit**

```bash
git add src/lib/mover/today.ts tests/unit/mover/today.test.ts
git -c user.email='maximiliano.winkler@fahorro.com.mx' -c user.name='Maximiliano Winkler' commit -m "feat(mover): add today schedule resolver with TDD

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: PR detection logic (TDD) — `src/lib/mover/compute-pr.ts`

PR rule: a set is a PR if its **estimated 1-rep max (e1RM)** beats the user's previous max for that exercise. Formula: Epley `weight × (1 + reps/30)`. This handles both more weight × same reps AND same weight × more reps.

**Files:**
- Create: `src/lib/mover/compute-pr.ts`
- Create: `tests/unit/mover/compute-pr.test.ts`

- [ ] **Step 1: Test**

```ts
import { describe, it, expect } from "vitest";
import { e1rm, isPr, type PriorSetSummary } from "@/lib/mover/compute-pr";

describe("e1rm (Epley)", () => {
  it("equals weight when reps = 1", () => {
    expect(e1rm(100, 1)).toBe(100);
  });
  it("scales weight by 1 + reps/30", () => {
    expect(e1rm(60, 10)).toBeCloseTo(80, 1);   // 60 * (1 + 10/30) = 80
    expect(e1rm(100, 5)).toBeCloseTo(116.67, 1); // 100 * (1 + 5/30) = 116.67
  });
  it("returns 0 for null weight or reps", () => {
    expect(e1rm(null, 5)).toBe(0);
    expect(e1rm(60, null)).toBe(0);
    expect(e1rm(null, null)).toBe(0);
  });
});

describe("isPr", () => {
  const prior: PriorSetSummary = { max_e1rm: 80 };
  it("true when new e1rm beats prior", () => {
    expect(isPr({ weight_kg: 70, reps: 10 }, prior)).toBe(true);  // e1rm 93.3 > 80
  });
  it("false when ties or below", () => {
    expect(isPr({ weight_kg: 60, reps: 10 }, prior)).toBe(false); // 80 === 80
    expect(isPr({ weight_kg: 50, reps: 10 }, prior)).toBe(false); // 66.7 < 80
  });
  it("true when no prior history (first ever set)", () => {
    expect(isPr({ weight_kg: 60, reps: 10 }, null)).toBe(true);
    expect(isPr({ weight_kg: 60, reps: 10 }, { max_e1rm: 0 })).toBe(true);
  });
  it("false for null weight or reps", () => {
    expect(isPr({ weight_kg: null, reps: 10 }, prior)).toBe(false);
    expect(isPr({ weight_kg: 60, reps: null }, prior)).toBe(false);
  });
});
```

- [ ] **Step 2: Test fails**

```bash
pnpm test
```

- [ ] **Step 3: Implement**

```ts
// src/lib/mover/compute-pr.ts
export type PriorSetSummary = { max_e1rm: number } | null;

export function e1rm(weight: number | null, reps: number | null): number {
  if (weight == null || reps == null || weight <= 0 || reps <= 0) return 0;
  return weight * (1 + reps / 30);
}

export function isPr(
  newSet: { weight_kg: number | null; reps: number | null },
  prior: PriorSetSummary
): boolean {
  const newE = e1rm(newSet.weight_kg, newSet.reps);
  if (newE <= 0) return false;
  if (!prior || prior.max_e1rm <= 0) return true;
  return newE > prior.max_e1rm;
}
```

- [ ] **Step 4: Test passes**

```bash
pnpm test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/mover/compute-pr.ts tests/unit/mover/compute-pr.test.ts
git -c user.email='maximiliano.winkler@fahorro.com.mx' -c user.name='Maximiliano Winkler' commit -m "feat(mover): add PR detection (Epley e1rm) with TDD

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: TanStack Query hooks (read) — `src/lib/mover/queries.ts`

**Files:**
- Create: `src/lib/mover/queries.ts`

- [ ] **Step 1: Implement queries**

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export function useActivePlan() {
  return useQuery({
    queryKey: ["mover", "activePlan"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function usePlanSchedule(planId: string | undefined) {
  return useQuery({
    queryKey: ["mover", "schedule", planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_schedule_slots")
        .select("*, template:workout_templates(id, name)")
        .eq("plan_id", planId!)
        .order("day_of_week");
      if (error) throw error;
      return data;
    },
  });
}

export function useTemplateExercises(templateId: string | undefined) {
  return useQuery({
    queryKey: ["mover", "templateExercises", templateId],
    enabled: !!templateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_template_exercises")
        .select("*, exercise:exercises(*)")
        .eq("template_id", templateId!)
        .order("position");
      if (error) throw error;
      return data;
    },
  });
}

export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["mover", "session", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("*, template:workout_templates(id, name)")
        .eq("id", sessionId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useSessionSetLogs(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["mover", "setLogs", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercise_set_logs")
        .select("*")
        .eq("session_id", sessionId!)
        .order("set_number");
      if (error) throw error;
      return data;
    },
  });
}

export function useRecentSessions(limit = 30) {
  return useQuery({
    queryKey: ["mover", "recentSessions", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("*, template:workout_templates(id, name)")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}

export function useExercisePriorMax(exerciseId: string | undefined) {
  // Returns max e1rm across user's history for this exercise
  return useQuery({
    queryKey: ["mover", "priorMax", exerciseId],
    enabled: !!exerciseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercise_set_logs")
        .select("weight_kg, reps")
        .eq("exercise_id", exerciseId!)
        .not("weight_kg", "is", null)
        .not("reps", "is", null);
      if (error) throw error;
      const maxE = data.reduce((max, s) => {
        const e = (s.weight_kg ?? 0) * (1 + (s.reps ?? 0) / 30);
        return e > max ? e : max;
      }, 0);
      return { max_e1rm: maxE };
    },
  });
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/mover/queries.ts
git -c user.email='maximiliano.winkler@fahorro.com.mx' -c user.name='Maximiliano Winkler' commit -m "feat(mover): add TanStack Query read hooks

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: TanStack Query hooks (write) — `src/lib/mover/mutations.ts`

**Files:**
- Create: `src/lib/mover/mutations.ts`

- [ ] **Step 1: Implement mutations**

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { isPr } from "./compute-pr";

const supabase = createClient();

export function useStartSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { templateId: string | null; date?: string }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("workout_sessions")
        .insert({
          user_id: u.user.id,
          template_id: params.templateId,
          date: params.date ?? new Date().toISOString().slice(0, 10),
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mover", "recentSessions"] });
    },
  });
}

export function useLogSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      sessionId: string;
      exerciseId: string;
      setNumber: number;
      reps: number | null;
      weightKg: number | null;
      durationSec?: number | null;
      rpe?: number | null;
      notes?: string | null;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");

      // Compute prior max for PR detection
      const { data: priorRows } = await supabase
        .from("exercise_set_logs")
        .select("weight_kg, reps")
        .eq("exercise_id", params.exerciseId)
        .not("weight_kg", "is", null)
        .not("reps", "is", null);
      const priorMax = (priorRows ?? []).reduce((max, s) => {
        const e = (s.weight_kg ?? 0) * (1 + (s.reps ?? 0) / 30);
        return e > max ? e : max;
      }, 0);
      const pr = isPr(
        { weight_kg: params.weightKg, reps: params.reps },
        priorMax > 0 ? { max_e1rm: priorMax } : null
      );

      const { data, error } = await supabase
        .from("exercise_set_logs")
        .insert({
          user_id: u.user.id,
          session_id: params.sessionId,
          exercise_id: params.exerciseId,
          set_number: params.setNumber,
          reps: params.reps,
          weight_kg: params.weightKg,
          duration_sec: params.durationSec ?? null,
          rpe: params.rpe ?? null,
          notes: params.notes ?? null,
          is_pr: pr,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["mover", "setLogs", vars.sessionId] });
      qc.invalidateQueries({ queryKey: ["mover", "priorMax", vars.exerciseId] });
    },
  });
}

export function useCompleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      sessionId: string;
      overallRpe?: number | null;
      notes?: string | null;
    }) => {
      const endedAt = new Date();
      const { data: session } = await supabase
        .from("workout_sessions")
        .select("started_at")
        .eq("id", params.sessionId)
        .single();
      const startedAt = session?.started_at ? new Date(session.started_at) : endedAt;
      const durationMin = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));

      const { data, error } = await supabase
        .from("workout_sessions")
        .update({
          status: "completed",
          ended_at: endedAt.toISOString(),
          duration_min: durationMin,
          overall_rpe: params.overallRpe ?? null,
          notes: params.notes ?? null,
        })
        .eq("id", params.sessionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mover", "recentSessions"] });
    },
  });
}

export function useDeleteSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { setId: string; sessionId: string }) => {
      const { error } = await supabase.from("exercise_set_logs").delete().eq("id", params.setId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["mover", "setLogs", vars.sessionId] });
    },
  });
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/mover/mutations.ts
git -c user.email='maximiliano.winkler@fahorro.com.mx' -c user.name='Maximiliano Winkler' commit -m "feat(mover): add TanStack Query write hooks (start/log/complete/delete)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Today banner component

**Files:**
- Create: `src/components/mover/today-banner.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useActivePlan, usePlanSchedule, useTemplateExercises } from "@/lib/mover/queries";
import { useStartSession } from "@/lib/mover/mutations";
import { findScheduleSlotForToday } from "@/lib/mover/today";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function TodayBanner() {
  const router = useRouter();
  const { data: plan, isLoading: planLoading } = useActivePlan();
  const { data: slots, isLoading: slotsLoading } = usePlanSchedule(plan?.id);
  const slot = slots ? findScheduleSlotForToday(slots) : undefined;
  const templateId = slot?.template_id ?? undefined;
  const { data: exercises, isLoading: exLoading } = useTemplateExercises(templateId);
  const startSession = useStartSession();

  if (planLoading || slotsLoading) return <Skeleton className="h-32 w-full rounded-xl" />;

  if (!plan) {
    return (
      <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-alt)] p-5 text-center">
        <p className="text-sm text-muted-foreground">No tienes un plan activo. Aplica el seed SQL en Supabase para arrancar.</p>
      </div>
    );
  }

  if (!slot) {
    return (
      <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-alt)] p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Hoy</p>
        <h2 className="text-xl font-bold mt-1">Sin actividad programada</h2>
      </div>
    );
  }

  // Rest day or other activity (no template)
  if (!templateId) {
    return (
      <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-alt)] p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Hoy · {plan.name}</p>
        <h2 className="text-2xl font-bold mt-1">{slot.activity_label}</h2>
        <p className="text-sm text-muted-foreground mt-2">No hay sesión de gym hoy. Disfruta o haz tu actividad alterna.</p>
      </div>
    );
  }

  const templateName = (slots ?? []).find(s => s.template_id === templateId)?.template?.name ?? "Workout";

  async function handleStart() {
    const session = await startSession.mutateAsync({ templateId });
    router.push(`/mover/session/${session.id}`);
  }

  return (
    <div className="rounded-xl border border-[var(--border-strong)] bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Hoy · {plan.name} · Semana {plan.current_week}</p>
      <h2 className="text-2xl font-bold mt-1">{templateName}</h2>
      {exLoading ? (
        <Skeleton className="h-20 w-full mt-3 rounded-md" />
      ) : (
        <ul className="mt-3 space-y-1 text-sm text-[var(--foreground)]/85">
          {(exercises ?? []).map(ex => (
            <li key={ex.id} className="flex justify-between">
              <span>{ex.is_warmup ? "🔥 " : ""}{ex.exercise?.name}</span>
              <span className="text-muted-foreground">
                {ex.prescribed_sets} × {ex.reps_min === ex.reps_max ? ex.reps_min : `${ex.reps_min}-${ex.reps_max}`}
                {ex.target_rpe ? ` · RPE ${ex.target_rpe}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Button onClick={handleStart} className="w-full mt-4" size="lg" disabled={startSession.isPending}>
        {startSession.isPending ? "Iniciando..." : "💪 Empezar entrenamiento"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mover/today-banner.tsx
git -c user.email='maximiliano.winkler@fahorro.com.mx' -c user.name='Maximiliano Winkler' commit -m "feat(mover): add today banner with workout preview + start button

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Plan week view component

**Files:**
- Create: `src/components/mover/plan-week-view.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";

import { useActivePlan, usePlanSchedule } from "@/lib/mover/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { dayOfWeek } from "@/lib/mover/today";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function PlanWeekView() {
  const { data: plan, isLoading: planLoading } = useActivePlan();
  const { data: slots, isLoading: slotsLoading } = usePlanSchedule(plan?.id);
  const todayDow = dayOfWeek(new Date());

  if (planLoading || slotsLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!plan) return <p className="text-sm text-muted-foreground">Sin plan activo.</p>;

  const ordered = [1, 2, 3, 4, 5, 6, 0].map(dow => {
    const slot = (slots ?? []).find(s => s.day_of_week === dow);
    return { dow, slot };
  });

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{plan.name}</p>
          <p className="text-sm">Semana {plan.current_week} de {plan.mesocycle_weeks}</p>
        </div>
      </div>
      {ordered.map(({ dow, slot }) => {
        const isToday = dow === todayDow;
        const label = slot?.template?.name ?? slot?.activity_label ?? "—";
        const hasWorkout = !!slot?.template_id;
        return (
          <div
            key={dow}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${isToday ? "border-[hsl(var(--primary))] bg-[var(--accent-bg)]" : "border-[var(--border-strong)] bg-white"}`}
          >
            <span className={`text-xs font-bold uppercase tracking-wide w-12 ${isToday ? "text-primary" : "text-muted-foreground"}`}>{DAY_NAMES[dow]}</span>
            <span className={`flex-1 text-sm font-medium ${hasWorkout ? "" : "text-muted-foreground"}`}>{label}</span>
            {isToday && <span className="text-[10px] uppercase font-bold text-primary">Hoy</span>}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mover/plan-week-view.tsx
git -c user.email='maximiliano.winkler@fahorro.com.mx' -c user.name='Maximiliano Winkler' commit -m "feat(mover): add plan week view component

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Session list (history) component

**Files:**
- Create: `src/components/mover/session-list.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";

import Link from "next/link";
import { useRecentSessions } from "@/lib/mover/queries";
import { Skeleton } from "@/components/ui/skeleton";

export function SessionList() {
  const { data, isLoading } = useRecentSessions(50);

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay sesiones registradas.</p>;
  }

  return (
    <div className="space-y-2">
      {data.map(s => {
        const dateStr = new Date(s.date).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
        const statusBadge =
          s.status === "completed" ? "✓" : s.status === "in_progress" ? "⏱" : s.status === "skipped" ? "⤫" : "•";
        return (
          <Link
            key={s.id}
            href={`/mover/history/${s.id}`}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border-strong)] bg-white hover:bg-[var(--surface-alt)]"
          >
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground w-20">{dateStr}</span>
            <span className="flex-1 text-sm font-medium">{s.template?.name ?? "Sesión libre"}</span>
            <span className="text-xs text-muted-foreground">{s.duration_min ? `${s.duration_min}m` : "—"}</span>
            <span className="text-sm">{statusBadge}</span>
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mover/session-list.tsx
git -c user.email='maximiliano.winkler@fahorro.com.mx' -c user.name='Maximiliano Winkler' commit -m "feat(mover): add session history list component

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Rest timer component

**Files:**
- Create: `src/components/mover/rest-timer.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  durationSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
};

export function RestTimer({ durationSeconds, onComplete, autoStart = false }: Props) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [running, setRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRunning(false);
          onComplete?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, onComplete]);

  useEffect(() => {
    setRemaining(durationSeconds);
  }, [durationSeconds]);

  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-3 rounded-lg bg-[var(--accent-bg)] p-3">
      <span className="font-mono text-2xl font-bold text-primary tabular-nums">{mm}:{ss}</span>
      <div className="flex gap-2 ml-auto">
        {!running ? (
          <Button size="sm" onClick={() => setRunning(true)} disabled={remaining === 0}>Iniciar</Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setRunning(false)}>Pausar</Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => { setRemaining(durationSeconds); setRunning(false); }}>Reset</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mover/rest-timer.tsx
git -c user.email='maximiliano.winkler@fahorro.com.mx' -c user.name='Maximiliano Winkler' commit -m "feat(mover): add rest timer component

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Set input row component

**Files:**
- Create: `src/components/mover/set-input-row.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type Props = {
  setNumber: number;
  initialWeight?: number | null;
  initialReps?: number | null;
  initialRpe?: number | null;
  saved?: boolean;
  isPr?: boolean;
  pending?: boolean;
  onSave: (vals: { weight: number | null; reps: number | null; rpe: number | null }) => void;
  onDelete?: () => void;
};

export function SetInputRow({ setNumber, initialWeight, initialReps, initialRpe, saved, isPr, pending, onSave, onDelete }: Props) {
  const [weight, setWeight] = useState<string>(initialWeight?.toString() ?? "");
  const [reps, setReps] = useState<string>(initialReps?.toString() ?? "");
  const [rpe, setRpe] = useState<string>(initialRpe?.toString() ?? "");

  function handleSave() {
    onSave({
      weight: weight === "" ? null : Number(weight),
      reps: reps === "" ? null : Number(reps),
      rpe: rpe === "" ? null : Number(rpe),
    });
  }

  return (
    <div className={`grid grid-cols-[40px_1fr_1fr_1fr_auto] items-center gap-2 py-2 px-2 rounded-md ${saved ? "bg-[var(--surface-alt)]" : ""}`}>
      <span className="text-sm font-bold text-muted-foreground">{setNumber}</span>
      <Input
        type="number"
        inputMode="decimal"
        placeholder="kg"
        value={weight}
        onChange={e => setWeight(e.target.value)}
        disabled={saved}
        className="h-9 text-sm"
      />
      <Input
        type="number"
        inputMode="numeric"
        placeholder="reps"
        value={reps}
        onChange={e => setReps(e.target.value)}
        disabled={saved}
        className="h-9 text-sm"
      />
      <Input
        type="number"
        inputMode="numeric"
        placeholder="RPE"
        value={rpe}
        onChange={e => setRpe(e.target.value)}
        disabled={saved}
        min={1}
        max={10}
        className="h-9 text-sm"
      />
      {!saved ? (
        <Button size="sm" onClick={handleSave} disabled={pending}>
          {pending ? "..." : "✓"}
        </Button>
      ) : (
        <div className="flex items-center gap-1">
          {isPr && <span title="Personal Record" className="text-base">🏆</span>}
          {onDelete && (
            <Button size="sm" variant="ghost" onClick={onDelete}>
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mover/set-input-row.tsx
git -c user.email='maximiliano.winkler@fahorro.com.mx' -c user.name='Maximiliano Winkler' commit -m "feat(mover): add set input row component

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Substitute picker modal

**Files:**
- Create: `src/components/mover/substitute-picker.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Exercise = { id: string; name: string; muscle_groups: string[] };

type Props = {
  open: boolean;
  onClose: () => void;
  substituteIds: string[];
  onPick: (exercise: Exercise) => void;
};

export function SubstitutePicker({ open, onClose, substituteIds, onPick }: Props) {
  const [subs, setSubs] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || substituteIds.length === 0) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("exercises")
      .select("id, name, muscle_groups")
      .in("id", substituteIds)
      .then(({ data }) => {
        setSubs((data as Exercise[]) ?? []);
        setLoading(false);
      });
  }, [open, substituteIds]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sustituir ejercicio</DialogTitle>
        </DialogHeader>
        {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {!loading && subs.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay sustitutos definidos.</p>
        )}
        {!loading && subs.length > 0 && (
          <div className="space-y-2">
            {subs.map(s => (
              <Button
                key={s.id}
                variant="outline"
                className="w-full justify-start h-auto py-3 flex flex-col items-start"
                onClick={() => { onPick(s); onClose(); }}
              >
                <span className="font-semibold">{s.name}</span>
                <span className="text-xs text-muted-foreground">{s.muscle_groups.join(", ")}</span>
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mover/substitute-picker.tsx
git -c user.email='maximiliano.winkler@fahorro.com.mx' -c user.name='Maximiliano Winkler' commit -m "feat(mover): add substitute picker modal

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: Exercise image placeholder

**Files:**
- Create: `src/components/mover/exercise-image-placeholder.tsx`

- [ ] **Step 1: Implement**

```tsx
type Props = { name: string; size?: number };

export function ExerciseImagePlaceholder({ name, size = 80 }: Props) {
  // Simple SVG placeholder with first letter — replaced by Gemini-generated images in Plan 2b
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="rounded-lg bg-[var(--surface-alt)] border border-[var(--border-strong)] flex items-center justify-center font-bold text-muted-foreground"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-label={name}
    >
      {initial}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mover/exercise-image-placeholder.tsx
git -c user.email='maximiliano.winkler@fahorro.com.mx' -c user.name='Maximiliano Winkler' commit -m "feat(mover): add placeholder image for exercises (Gemini comes in 2b)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 15: Rewrite `/mover` page with tabs (Hoy / Plan / Historial)

**Files:**
- Modify: `src/app/(app)/mover/page.tsx`

- [ ] **Step 1: Replace placeholder with tabbed view**

```tsx
"use client";

import { ModuleHeader } from "@/components/layout/module-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TodayBanner } from "@/components/mover/today-banner";
import { PlanWeekView } from "@/components/mover/plan-week-view";
import { SessionList } from "@/components/mover/session-list";

export default function MoverPage() {
  return (
    <>
      <ModuleHeader title="Ejercicio" />
      <Tabs defaultValue="hoy" className="w-full">
        <TabsList className="mb-5">
          <TabsTrigger value="hoy">Hoy</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="hoy">
          <TodayBanner />
        </TabsContent>
        <TabsContent value="plan">
          <PlanWeekView />
        </TabsContent>
        <TabsContent value="historial">
          <SessionList />
        </TabsContent>
      </Tabs>
    </>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/mover/page.tsx
git -c user.email='maximiliano.winkler@fahorro.com.mx' -c user.name='Maximiliano Winkler' commit -m "feat(mover): rewrite /mover with Hoy/Plan/Historial tabs

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 16: Active session page (the main UX)

**Files:**
- Create: `src/app/(app)/mover/session/[id]/page.tsx`

This is the most substantial task. Active session UI with exercise navigation, set inputs, rest timer, substitute, finish.

- [ ] **Step 1: Implement**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, useSessionSetLogs, useTemplateExercises } from "@/lib/mover/queries";
import { useLogSet, useCompleteSession, useDeleteSet } from "@/lib/mover/mutations";
import { Button } from "@/components/ui/button";
import { ExerciseImagePlaceholder } from "@/components/mover/exercise-image-placeholder";
import { SetInputRow } from "@/components/mover/set-input-row";
import { RestTimer } from "@/components/mover/rest-timer";
import { SubstitutePicker } from "@/components/mover/substitute-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function SessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = params.id;

  const { data: session, isLoading: sLoading } = useSession(sessionId);
  const { data: prescribed, isLoading: pLoading } = useTemplateExercises(session?.template_id ?? undefined);
  const { data: setLogs } = useSessionSetLogs(sessionId);

  const logSet = useLogSet();
  const deleteSet = useDeleteSet();
  const completeSession = useCompleteSession();

  // Local state: which exercise is the user on, and substitution overrides
  const [currentIdx, setCurrentIdx] = useState(0);
  const [substitutes, setSubstitutes] = useState<Record<string, { id: string; name: string }>>({}); // templateExerciseId → swapped exercise
  const [pickerOpen, setPickerOpen] = useState(false);

  if (sLoading || pLoading) return <Skeleton className="h-96 w-full" />;
  if (!session) return <p>Sesión no encontrada.</p>;
  if (!prescribed || prescribed.length === 0) return <p>No hay ejercicios prescritos.</p>;

  const current = prescribed[currentIdx];
  const exerciseToUse = substitutes[current.id]
    ? { id: substitutes[current.id].id, name: substitutes[current.id].name }
    : { id: current.exercise!.id, name: current.exercise!.name };
  const setsForCurrent = (setLogs ?? []).filter(s => s.exercise_id === exerciseToUse.id);
  const setsDone = setsForCurrent.length;
  const setsRemaining = current.prescribed_sets - setsDone;

  async function handleSaveSet(vals: { weight: number | null; reps: number | null; rpe: number | null }) {
    const result = await logSet.mutateAsync({
      sessionId,
      exerciseId: exerciseToUse.id,
      setNumber: setsDone + 1,
      weightKg: vals.weight,
      reps: vals.reps,
      rpe: vals.rpe,
    });
    if (result.is_pr) toast.success("🏆 Personal Record!");
  }

  async function handleFinish() {
    await completeSession.mutateAsync({ sessionId });
    toast.success("Sesión completada");
    router.push("/mover");
  }

  function nextExercise() {
    if (currentIdx < prescribed.length - 1) setCurrentIdx(i => i + 1);
  }
  function prevExercise() {
    if (currentIdx > 0) setCurrentIdx(i => i - 1);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
            Ejercicio {currentIdx + 1} de {prescribed.length}
          </p>
          <h1 className="text-xl font-bold tracking-tight">{exerciseToUse.name}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)} disabled={current.exercise!.substitute_ids.length === 0}>
          Sustituir
        </Button>
      </div>

      {/* Exercise card */}
      <div className="flex gap-4 items-start rounded-xl border border-[var(--border-strong)] bg-white p-4">
        <ExerciseImagePlaceholder name={exerciseToUse.name} size={96} />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-base">
            {current.prescribed_sets} sets × {current.reps_min === current.reps_max ? current.reps_min : `${current.reps_min}-${current.reps_max}`} reps
          </p>
          {current.target_rpe && <p className="text-muted-foreground">RPE objetivo: {current.target_rpe}</p>}
          {current.notes && <p className="text-muted-foreground mt-1">{current.notes}</p>}
          {current.exercise?.technique && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{current.exercise.technique}</p>}
        </div>
      </div>

      {/* Sets */}
      <div className="rounded-xl border border-[var(--border-strong)] bg-white p-3">
        <div className="grid grid-cols-[40px_1fr_1fr_1fr_auto] items-center gap-2 px-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>#</span><span>Peso</span><span>Reps</span><span>RPE</span><span></span>
        </div>
        {setsForCurrent.map(s => (
          <SetInputRow
            key={s.id}
            setNumber={s.set_number}
            initialWeight={s.weight_kg}
            initialReps={s.reps}
            initialRpe={s.rpe}
            saved
            isPr={s.is_pr}
            onSave={() => {}}
            onDelete={() => deleteSet.mutate({ setId: s.id, sessionId })}
          />
        ))}
        {setsRemaining > 0 && (
          <SetInputRow
            key={`new-${setsDone}`}
            setNumber={setsDone + 1}
            pending={logSet.isPending}
            onSave={handleSaveSet}
          />
        )}
      </div>

      {/* Rest timer */}
      {current.rest_seconds > 0 && setsDone > 0 && setsRemaining > 0 && (
        <RestTimer durationSeconds={current.rest_seconds} autoStart />
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={prevExercise} disabled={currentIdx === 0} className="flex-1">
          ← Anterior
        </Button>
        {currentIdx < prescribed.length - 1 ? (
          <Button onClick={nextExercise} className="flex-1">Siguiente →</Button>
        ) : (
          <Button onClick={handleFinish} className="flex-1" disabled={completeSession.isPending}>
            {completeSession.isPending ? "..." : "Terminar 🏁"}
          </Button>
        )}
      </div>

      <SubstitutePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        substituteIds={current.exercise?.substitute_ids ?? []}
        onPick={(ex) => setSubstitutes(s => ({ ...s, [current.id]: ex }))}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/mover/session/
git -c user.email='maximiliano.winkler@fahorro.com.mx' -c user.name='Maximiliano Winkler' commit -m "feat(mover): add active session page with set logging + rest timer + substitute

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 17: History detail page

**Files:**
- Create: `src/app/(app)/mover/history/[id]/page.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession, useSessionSetLogs } from "@/lib/mover/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: session, isLoading: sLoading } = useSession(params.id);
  const { data: logs, isLoading: lLoading } = useSessionSetLogs(params.id);

  if (sLoading || lLoading) return <Skeleton className="h-96 w-full" />;
  if (!session) return <p>Sesión no encontrada.</p>;

  const dateStr = new Date(session.date).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  // Group logs by exercise_id preserving order of appearance
  const exerciseOrder: string[] = [];
  const grouped: Record<string, typeof logs> = {};
  for (const l of logs ?? []) {
    if (!grouped[l.exercise_id]) {
      grouped[l.exercise_id] = [];
      exerciseOrder.push(l.exercise_id);
    }
    grouped[l.exercise_id]!.push(l);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <Link href="/mover" className="text-xs text-muted-foreground hover:text-foreground">← Volver</Link>
        <h1 className="text-2xl font-bold tracking-tight mt-1">{session.template?.name ?? "Sesión libre"}</h1>
        <p className="text-sm text-muted-foreground capitalize">{dateStr} · {session.duration_min ? `${session.duration_min} min` : "duración desconocida"} · {session.status}</p>
      </div>

      {(logs ?? []).length === 0 && <p className="text-sm text-muted-foreground">Sin sets registrados.</p>}

      {exerciseOrder.map(exId => (
        <ExerciseSetsBlock key={exId} exerciseId={exId} sets={grouped[exId] ?? []} />
      ))}

      {session.status === "in_progress" && (
        <Link href={`/mover/session/${session.id}`}>
          <Button className="w-full">Continuar sesión</Button>
        </Link>
      )}
    </div>
  );
}

function ExerciseSetsBlock({ exerciseId, sets }: { exerciseId: string; sets: NonNullable<ReturnType<typeof useSessionSetLogs>["data"]> }) {
  // Lookup exercise name via TanStack Query? For simplicity, query directly
  return (
    <div className="rounded-xl border border-[var(--border-strong)] bg-white p-4">
      <ExerciseName exerciseId={exerciseId} />
      <table className="w-full mt-3 text-sm">
        <thead className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
          <tr>
            <th className="text-left pb-1">#</th>
            <th className="text-left pb-1">Peso</th>
            <th className="text-left pb-1">Reps</th>
            <th className="text-left pb-1">RPE</th>
            <th className="text-right pb-1"></th>
          </tr>
        </thead>
        <tbody>
          {sets.map(s => (
            <tr key={s.id} className="border-t border-[var(--border-strong)]">
              <td className="py-1.5 font-semibold">{s.set_number}</td>
              <td className="py-1.5">{s.weight_kg ?? "—"} kg</td>
              <td className="py-1.5">{s.reps ?? "—"}</td>
              <td className="py-1.5">{s.rpe ?? "—"}</td>
              <td className="py-1.5 text-right">{s.is_pr && "🏆"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExerciseName({ exerciseId }: { exerciseId: string }) {
  const { useQuery } = require("@tanstack/react-query");
  const { createClient } = require("@/lib/supabase/client");
  const { data } = useQuery({
    queryKey: ["exerciseName", exerciseId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from("exercises").select("name").eq("id", exerciseId).single();
      return data?.name ?? "Ejercicio";
    },
  });
  return <h3 className="font-semibold">{data ?? "..."}</h3>;
}
```

- [ ] **Step 2: Refactor — replace require with proper imports at top**

The `require` calls inside `ExerciseName` are a code smell. Replace with regular imports:

```tsx
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
```

Move them to the top of file. Remove the `require` lines from inside the function.

- [ ] **Step 3: Build**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/mover/history/
git -c user.email='maximiliano.winkler@fahorro.com.mx' -c user.name='Maximiliano Winkler' commit -m "feat(mover): add session history detail page

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 18: E2E smoke test for active session

**Files:**
- Create: `tests/e2e/mover.spec.ts`

NOTE: This test requires a logged-in session AND seeded data. For unauthenticated CI, skip; for local manual run, document. Use `test.skip()` if Supabase auth is not bypassable.

- [ ] **Step 1: Write a guard test (passes without auth)**

```ts
import { test, expect } from "@playwright/test";

test("mover page is auth-gated", async ({ page }) => {
  await page.goto("/mover");
  await expect(page).toHaveURL(/\/login/);
});

test("mover route exists in sitemap", async ({ page }) => {
  // Attempt direct navigation as anon
  const response = await page.goto("/mover", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(500);
});
```

(Full E2E with logged-in session requires a session-bypass strategy that is out of scope for Plan 2a — covered in future testing plan.)

- [ ] **Step 2: Run E2E**

```bash
pnpm test:e2e
```

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/mover.spec.ts
git -c user.email='maximiliano.winkler@fahorro.com.mx' -c user.name='Maximiliano Winkler' commit -m "test: add mover route auth-gate smoke E2E

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 19: Final verification + push to deploy

**Files:** none (CI/deploy)

- [ ] **Step 1: Full local verification**

```bash
cd /Users/maximilianoleonardowinkler/Documents/Claude/health-app
pnpm typecheck   # 0 errors
pnpm test        # all unit tests pass (nav + today + compute-pr ≥ 9 tests)
pnpm test:e2e    # auth + mover smoke tests pass
pnpm build       # clean
```

- [ ] **Step 2: Commit any leftover changes (if any)**

```bash
git status
# if anything untracked or unstaged that belongs, commit
```

- [ ] **Step 3: Push to origin/main**

```bash
git push origin main
```

This triggers Vercel auto-deploy.

- [ ] **Step 4: USER ACTION — apply migrations to remote Supabase**

User needs to:
1. Open https://supabase.com/dashboard/project/rfyddhiutlcewsaykval/sql/new
2. Paste the contents of `supabase/migrations/20260505000000_workout_schema.sql` → Run
3. Paste the contents of `supabase/seed/workout-seed.sql` → Run (this is the per-user seed; runs as auth.uid())
4. Verify in Table Editor that `exercises`, `workout_plans`, etc. exist with rows

- [ ] **Step 5: Verify production deploy**

After Vercel finishes building, user opens their PWA, navigates to `/mover`, sees:
- Today banner with their assigned workout (or "Tenis 🎾" / "Descanso 😴" depending on day)
- Click "Empezar entrenamiento" → /mover/session/[id]
- Logs a few sets → ✓
- Press "Terminar 🏁" → returns to /mover
- Tab "Historial" → sees the session
- Tab "Plan" → sees the week schedule

---

## Done criteria

After completing all 19 tasks, all of these should be true:
- [ ] `pnpm typecheck` reports 0 errors
- [ ] `pnpm test` passes (≥ 9 unit tests: 3 nav + 3 today + 6 compute-pr = at least)
- [ ] `pnpm test:e2e` passes (4 tests now: 2 auth + 2 mover)
- [ ] `pnpm build` clean
- [ ] User can apply migration + seed via Supabase Dashboard
- [ ] User opens production PWA → `/mover` shows their plan
- [ ] User can run a full workout session (start → log sets → see PR badge → finish)
- [ ] Session appears in Historial tab
- [ ] All commits pushed to GitHub, Vercel deployed without errors

## Out of scope for this plan (Plan 2b)

- Gemini image generation for exercises (using placeholders for now)
- Daily complementary tip display + rotation
- Exercise CRUD UI (edit / add / archive from app)
- Plan editor UI (modify schedule, edit templates)
- Exercises tab (library browse + filter)
- Compliance metric display
- Mesocycle progression suggestions (week N weight recommendations)
- Cardio-specific session UX (duration tracking vs sets)
