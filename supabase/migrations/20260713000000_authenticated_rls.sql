-- =====================================================
-- Enforce authenticated, per-user access across Mi Salud.
-- Safe to run after all previous migrations.
-- =====================================================

begin;

alter table public.profiles                       enable row level security;
alter table public.exercises                      enable row level security;
alter table public.workout_plans                  enable row level security;
alter table public.workout_templates              enable row level security;
alter table public.workout_template_exercises     enable row level security;
alter table public.plan_schedule_slots            enable row level security;
alter table public.workout_sessions               enable row level security;
alter table public.exercise_set_logs              enable row level security;
alter table public.daily_tips                     enable row level security;
alter table public.daily_tip_logs                 enable row level security;
alter table public.supplements                    enable row level security;
alter table public.supplement_schedules           enable row level security;
alter table public.supplement_logs                enable row level security;
alter table public.supplement_stacks              enable row level security;
alter table public.supplement_stack_items         enable row level security;
alter table public.habits                         enable row level security;
alter table public.habit_logs                     enable row level security;

-- Canonical policies for tables that expose user_id directly.
do $$
declare
  t text;
begin
  foreach t in array array[
    'exercises',
    'workout_plans',
    'workout_templates',
    'workout_template_exercises',
    'plan_schedule_slots',
    'workout_sessions',
    'exercise_set_logs',
    'daily_tip_logs',
    'supplements',
    'supplement_schedules',
    'supplement_logs',
    'supplement_stacks',
    'habits',
    'habit_logs'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (auth.uid() = user_id)',
      t || '_select_own', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (auth.uid() = user_id)',
      t || '_insert_own', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t || '_update_own', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (auth.uid() = user_id)',
      t || '_delete_own', t
    );
  end loop;
end$$;

-- Profile policies used a different naming convention in the first migration.
drop policy if exists "users can read own profile" on public.profiles;
drop policy if exists "users can insert own profile" on public.profiles;
drop policy if exists "users can update own profile" on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_delete_own on public.profiles;

create policy profiles_select_own on public.profiles
  for select to authenticated using (auth.uid() = user_id);
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (auth.uid() = user_id);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy profiles_delete_own on public.profiles
  for delete to authenticated using (auth.uid() = user_id);

-- System tips (user_id null) are readable; personal tips remain user-scoped.
drop policy if exists daily_tips_select_own_or_seed on public.daily_tips;
drop policy if exists daily_tips_insert_own on public.daily_tips;
drop policy if exists daily_tips_update_own on public.daily_tips;
drop policy if exists daily_tips_delete_own on public.daily_tips;

create policy daily_tips_select_own_or_seed on public.daily_tips
  for select to authenticated using (auth.uid() = user_id or user_id is null);
create policy daily_tips_insert_own on public.daily_tips
  for insert to authenticated with check (auth.uid() = user_id);
create policy daily_tips_update_own on public.daily_tips
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy daily_tips_delete_own on public.daily_tips
  for delete to authenticated using (auth.uid() = user_id);

-- Stack items inherit ownership through their parent stack.
drop policy if exists supplement_stack_items_select_own on public.supplement_stack_items;
drop policy if exists supplement_stack_items_insert_own on public.supplement_stack_items;
drop policy if exists supplement_stack_items_update_own on public.supplement_stack_items;
drop policy if exists supplement_stack_items_delete_own on public.supplement_stack_items;

create policy supplement_stack_items_select_own on public.supplement_stack_items
  for select to authenticated using (
    exists (
      select 1 from public.supplement_stacks
      where id = stack_id and user_id = auth.uid()
    )
  );
create policy supplement_stack_items_insert_own on public.supplement_stack_items
  for insert to authenticated with check (
    exists (
      select 1 from public.supplement_stacks
      where id = stack_id and user_id = auth.uid()
    )
  );
create policy supplement_stack_items_update_own on public.supplement_stack_items
  for update to authenticated
  using (
    exists (
      select 1 from public.supplement_stacks
      where id = stack_id and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.supplement_stacks
      where id = stack_id and user_id = auth.uid()
    )
  );
create policy supplement_stack_items_delete_own on public.supplement_stack_items
  for delete to authenticated using (
    exists (
      select 1 from public.supplement_stacks
      where id = stack_id and user_id = auth.uid()
    )
  );

notify pgrst, 'reload schema';

commit;

