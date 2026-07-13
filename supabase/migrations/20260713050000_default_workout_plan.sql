-- =====================================================
-- Self-service default workout plan for authenticated users.
-- Two 45-minute strength sessions plus 150 minutes of Zone 2.
-- Existing active plans are never replaced.
-- =====================================================

begin;

create or replace function public.install_default_workout_plan()
returns public.workout_plans
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan public.workout_plans;
  v_template_a uuid;
  v_template_b uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_plan
  from public.workout_plans
  where user_id = v_user_id and is_active
  order by created_at
  limit 1;

  if found then
    return v_plan;
  end if;

  insert into public.exercises (
    user_id,
    name,
    exercise_type,
    muscle_groups,
    equipment,
    technique,
    is_seed
  )
  select
    v_user_id,
    seed.name,
    'strength',
    seed.muscle_groups,
    seed.equipment,
    seed.technique,
    true
  from (
    values
      (
        'Goblet Squat',
        array['quads','glutes','core']::text[],
        array['dumbbell']::text[],
        'Mancuerna pegada al pecho. Mantén el torso estable y las rodillas alineadas con los pies.'
      ),
      (
        'Sentadilla con Barra',
        array['quads','glutes','hamstrings','core']::text[],
        array['barbell','rack']::text[],
        'Usa seguros, controla la bajada y conserva una profundidad que permita técnica estable.'
      ),
      (
        'Romanian Deadlift (RDL)',
        array['hamstrings','glutes','back']::text[],
        array['dumbbell','barbell']::text[],
        'Empuja la cadera atrás con espalda neutra y detén el recorrido antes de perder posición.'
      ),
      (
        'Hip Thrust con Mancuerna',
        array['glutes','hamstrings']::text[],
        array['dumbbell','bench']::text[],
        'Apoya la espalda alta, empuja con los talones y evita hiperextender la zona lumbar.'
      ),
      (
        'Press Banca con Mancuernas',
        array['chest','shoulders','triceps']::text[],
        array['dumbbell','bench']::text[],
        'Mantén los pies firmes y los codos aproximadamente a 45 grados del torso.'
      ),
      (
        'Press Banca Inclinado Mancuernas',
        array['chest','shoulders','triceps']::text[],
        array['dumbbell','bench']::text[],
        'Ajusta el banco a 30-45 grados y baja las mancuernas de forma controlada.'
      ),
      (
        'Remo con Mancuerna 1 Brazo',
        array['lats','upper_back','biceps']::text[],
        array['dumbbell','bench']::text[],
        'Con espalda estable, lleva la mancuerna hacia la cadera sin rotar el torso.'
      ),
      (
        'Jalón al Pecho (Lat Pulldown)',
        array['lats','biceps','upper_back']::text[],
        array['cable']::text[],
        'Lleva los codos abajo y atrás sin impulsar el torso ni jalar detrás de la cabeza.'
      ),
      (
        'Face Pull',
        array['rear_delts','traps','upper_back']::text[],
        array['cable']::text[],
        'Jala la cuerda hacia el rostro y termina con los codos altos y controlados.'
      ),
      (
        'Lateral Raise con Mancuernas',
        array['shoulders']::text[],
        array['dumbbell']::text[],
        'Eleva hasta una altura cómoda sin balancear el cuerpo ni encoger los hombros.'
      )
  ) as seed(name, muscle_groups, equipment, technique)
  where not exists (
    select 1
    from public.exercises existing
    where existing.user_id = v_user_id and existing.name = seed.name
  );

  insert into public.workout_plans (
    user_id,
    name,
    description,
    is_active,
    mesocycle_weeks,
    current_week
  ) values (
    v_user_id,
    'Fuerza A/B + Zona 2',
    'Base semanal editable: dos sesiones de fuerza de aproximadamente 45 min y 150 min de cardio moderado. Empieza conservador y adapta cargas, ejercicios o duración a tu capacidad.',
    true,
    4,
    1
  ) returning * into v_plan;

  insert into public.workout_templates (user_id, plan_id, name, position)
  values (v_user_id, v_plan.id, 'Fuerza A · 45 min', 1)
  returning id into v_template_a;

  insert into public.workout_templates (user_id, plan_id, name, position)
  values (v_user_id, v_plan.id, 'Fuerza B · 45 min', 2)
  returning id into v_template_b;

  insert into public.workout_template_exercises (
    user_id,
    template_id,
    exercise_id,
    position,
    prescribed_sets,
    reps_min,
    reps_max,
    target_rpe,
    rest_seconds,
    is_warmup,
    superset_with_position,
    notes
  )
  select
    v_user_id,
    v_template_a,
    exercise.id,
    prescription.position,
    prescription.prescribed_sets,
    prescription.reps_min,
    prescription.reps_max,
    prescription.target_rpe,
    prescription.rest_seconds,
    false,
    prescription.superset_with_position,
    prescription.notes
  from (
    values
      ('Sentadilla con Barra', 1, 3, 5, 8, 7, 150, null::int, 'Deja 2-3 repeticiones en reserva; usa Goblet Squat si la técnica aún no es estable.'),
      ('Press Banca con Mancuernas', 2, 3, 8, 10, 7, 60, 3, 'Superset con el remo.'),
      ('Remo con Mancuerna 1 Brazo', 3, 3, 10, 12, 7, 60, 2, 'Superset con el press; repeticiones por brazo.'),
      ('Romanian Deadlift (RDL)', 4, 3, 8, 10, 7, 120, null::int, 'Recorrido controlado y espalda neutra.'),
      ('Face Pull', 5, 2, 12, 15, 6, 60, null::int, 'Final técnico, sin llegar al fallo.')
  ) as prescription(
    exercise_name,
    position,
    prescribed_sets,
    reps_min,
    reps_max,
    target_rpe,
    rest_seconds,
    superset_with_position,
    notes
  )
  join lateral (
    select id
    from public.exercises
    where user_id = v_user_id and name = prescription.exercise_name
    order by created_at
    limit 1
  ) exercise on true;

  insert into public.workout_template_exercises (
    user_id,
    template_id,
    exercise_id,
    position,
    prescribed_sets,
    reps_min,
    reps_max,
    target_rpe,
    rest_seconds,
    is_warmup,
    superset_with_position,
    notes
  )
  select
    v_user_id,
    v_template_b,
    exercise.id,
    prescription.position,
    prescription.prescribed_sets,
    prescription.reps_min,
    prescription.reps_max,
    prescription.target_rpe,
    prescription.rest_seconds,
    false,
    prescription.superset_with_position,
    prescription.notes
  from (
    values
      ('Goblet Squat', 1, 3, 10, 12, 7, 90, null::int, 'Prioriza rango cómodo y controlado.'),
      ('Press Banca Inclinado Mancuernas', 2, 3, 8, 10, 7, 60, 3, 'Superset con el jalón al pecho.'),
      ('Jalón al Pecho (Lat Pulldown)', 3, 3, 10, 12, 7, 60, 2, 'Superset con el press inclinado.'),
      ('Hip Thrust con Mancuerna', 4, 3, 10, 12, 7, 90, null::int, 'Pausa breve arriba sin hiperextender la espalda.'),
      ('Lateral Raise con Mancuernas', 5, 2, 12, 15, 6, 60, null::int, 'Final técnico, sin balanceo.')
  ) as prescription(
    exercise_name,
    position,
    prescribed_sets,
    reps_min,
    reps_max,
    target_rpe,
    rest_seconds,
    superset_with_position,
    notes
  )
  join lateral (
    select id
    from public.exercises
    where user_id = v_user_id and name = prescription.exercise_name
    order by created_at
    limit 1
  ) exercise on true;

  insert into public.plan_schedule_slots (
    user_id,
    plan_id,
    day_of_week,
    template_id,
    activity_label
  ) values
    (v_user_id, v_plan.id, 1, v_template_a, null),
    (v_user_id, v_plan.id, 2, null, 'Zona 2 · 45 min'),
    (v_user_id, v_plan.id, 3, null, 'Movilidad o caminata · 20 min'),
    (v_user_id, v_plan.id, 4, v_template_b, null),
    (v_user_id, v_plan.id, 5, null, 'Zona 2 · 45 min'),
    (v_user_id, v_plan.id, 6, null, 'Zona 2 · 60 min'),
    (v_user_id, v_plan.id, 0, null, 'Descanso');

  return v_plan;
end;
$$;

revoke all on function public.install_default_workout_plan() from public, anon;
grant execute on function public.install_default_workout_plan() to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
