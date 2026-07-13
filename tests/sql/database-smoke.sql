\set ON_ERROR_STOP on

begin;

insert into auth.users (
  id,
  email,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  (
    '11111111-1111-4111-8111-111111111111',
    'database-smoke-one@example.test',
    '{}',
    '{"name":"Database Smoke One"}',
    now(),
    now()
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'database-smoke-two@example.test',
    '{}',
    '{"name":"Database Smoke Two"}',
    now(),
    now()
  );

do $$
declare
  v_tables constant text[] := array[
    'profiles',
    'exercises',
    'workout_plans',
    'workout_templates',
    'workout_template_exercises',
    'plan_schedule_slots',
    'workout_sessions',
    'exercise_set_logs',
    'daily_tips',
    'daily_tip_logs',
    'supplements',
    'supplement_schedules',
    'supplement_logs',
    'supplement_stacks',
    'supplement_stack_items',
    'habits',
    'habit_logs',
    'food_entries',
    'biomarker_results'
  ];
  v_table text;
begin
  foreach v_table in array v_tables loop
    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = v_table
        and c.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', v_table;
    end if;

    if not has_table_privilege(
      'authenticated',
      format('public.%I', v_table),
      'select, insert, update, delete'
    ) then
      raise exception 'authenticated is missing CRUD privileges on public.%', v_table;
    end if;

    if has_table_privilege('anon', format('public.%I', v_table), 'select') then
      raise exception 'anon unexpectedly has SELECT privilege on public.%', v_table;
    end if;
  end loop;
end
$$;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);

do $$
declare
  v_user_one constant uuid := '11111111-1111-4111-8111-111111111111';
  v_user_two constant uuid := '22222222-2222-4222-8222-222222222222';
  v_supplement_id uuid;
  v_stack_id uuid;
  v_plan_id uuid;
  v_repeated_plan_id uuid;
  v_count integer;
  v_affected integer;
  v_cross_user_insert_blocked boolean := false;
begin
  if auth.uid() <> v_user_one then
    raise exception 'Unexpected auth.uid(): %', auth.uid();
  end if;

  select count(*) into v_count from public.profiles;
  if v_count <> 1 then
    raise exception 'User one should see exactly one profile, saw %', v_count;
  end if;

  insert into public.food_entries (
    user_id,
    name,
    meal_type,
    calories,
    protein_g,
    carbs_g,
    fat_g,
    fiber_g
  ) values (
    v_user_one,
    'Desayuno de prueba',
    'desayuno',
    420,
    32,
    40,
    14,
    8
  );

  insert into public.biomarker_results (
    user_id,
    marker_name,
    value,
    unit,
    reference_min,
    reference_max,
    measured_at
  ) values (
    v_user_one,
    'Glucosa',
    91,
    'mg/dL',
    70,
    99,
    current_date
  );

  insert into public.habits (
    user_id,
    name,
    time_of_day
  ) values (
    v_user_one,
    'Hábito de prueba',
    'manana'
  );

  insert into public.exercises (
    user_id,
    name,
    exercise_type
  ) values (
    v_user_one,
    'Sentadilla de prueba',
    'strength'
  );

  select (public.install_default_workout_plan()).id into v_plan_id;
  select (public.install_default_workout_plan()).id into v_repeated_plan_id;

  if v_plan_id <> v_repeated_plan_id then
    raise exception 'The workout installer is not idempotent';
  end if;

  select count(*) into v_count
  from public.workout_templates
  where plan_id = v_plan_id;
  if v_count <> 2 then
    raise exception 'The workout installer created % templates instead of two', v_count;
  end if;

  select count(*) into v_count
  from public.plan_schedule_slots
  where plan_id = v_plan_id;
  if v_count <> 7 then
    raise exception 'The workout installer created % schedule slots instead of seven', v_count;
  end if;

  select (public.save_supplement(
    null,
    'Vitamina de prueba',
    '',
    'capsula',
    100,
    'mg',
    'vitamina',
    '',
    '[{"time_of_day":"desayuno","days_of_week":[1,3,5],"reminder":true}]'::jsonb
  )).id into v_supplement_id;

  select (public.save_supplement_stack(
    null,
    'Stack de prueba',
    'Creado por la prueba de base de datos',
    array[v_supplement_id]
  )).id into v_stack_id;

  select count(*) into v_count
  from public.supplement_schedules
  where supplement_id = v_supplement_id;
  if v_count <> 1 then
    raise exception 'The supplement RPC did not save its schedule';
  end if;

  select count(*) into v_count
  from public.supplement_stack_items
  where stack_id = v_stack_id;
  if v_count <> 1 then
    raise exception 'The stack RPC did not save its item';
  end if;

  perform set_config('request.jwt.claim.sub', v_user_two::text, true);

  insert into public.food_entries (
    user_id,
    name,
    meal_type
  ) values (
    v_user_two,
    'Comida privada del usuario dos',
    'comida'
  );

  insert into public.biomarker_results (
    user_id,
    marker_name,
    value,
    unit
  ) values (
    v_user_two,
    'Biomarcador privado',
    1,
    'unidad'
  );

  begin
    insert into public.food_entries (
      user_id,
      name,
      meal_type
    ) values (
      v_user_one,
      'Intento cruzado',
      'snack'
    );
  exception
    when insufficient_privilege then
      v_cross_user_insert_blocked := true;
  end;

  if not v_cross_user_insert_blocked then
    raise exception 'RLS allowed a cross-user insert';
  end if;

  perform set_config('request.jwt.claim.sub', v_user_one::text, true);

  select count(*) into v_count from public.food_entries;
  if v_count <> 1 then
    raise exception 'User one should see one food entry, saw %', v_count;
  end if;

  select count(*) into v_count from public.biomarker_results;
  if v_count <> 1 then
    raise exception 'User one should see one biomarker, saw %', v_count;
  end if;

  update public.food_entries
  set notes = 'Actualización propia permitida';
  get diagnostics v_affected = row_count;
  if v_affected <> 1 then
    raise exception 'User one updated % food entries instead of one', v_affected;
  end if;

  update public.food_entries
  set notes = 'No debe ocurrir'
  where user_id = v_user_two;
  get diagnostics v_affected = row_count;
  if v_affected <> 0 then
    raise exception 'RLS allowed a cross-user update';
  end if;
end
$$;

reset role;
set local role anon;

do $$
declare
  v_anon_read_blocked boolean := false;
begin
  begin
    perform count(*) from public.food_entries;
  exception
    when insufficient_privilege then
      v_anon_read_blocked := true;
  end;

  if not v_anon_read_blocked then
    raise exception 'Anonymous access unexpectedly read health data';
  end if;
end
$$;

rollback;

\echo 'Database smoke test passed: grants, RLS isolation, RPCs, and anonymous denial.'
