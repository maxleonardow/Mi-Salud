-- =====================================================
-- Personalized 12-week workout plan.
-- Keeps prior plans and session history; activating this plan only archives
-- the previous plan by setting is_active = false.
-- =====================================================

begin;

create or replace function public.install_personalized_workout_plan(
  p_replace_active boolean default false
)
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
  v_template_c uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_plan
  from public.workout_plans
  where user_id = v_user_id
    and is_active
    and name = 'Plan atlético · 12 semanas'
  order by created_at desc
  limit 1;

  if found then
    return v_plan;
  end if;

  select * into v_plan
  from public.workout_plans
  where user_id = v_user_id and is_active
  order by created_at desc
  limit 1;

  if found and not p_replace_active then
    return v_plan;
  end if;

  if p_replace_active then
    update public.workout_plans
    set is_active = false
    where user_id = v_user_id and is_active;
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
      ('Prensa de Piernas', array['quads','glutes','hamstrings']::text[], array['leg_press']::text[], 'Apoya toda la espalda. Baja hasta donde la pelvis permanezca estable y empuja con el pie completo sin bloquear las rodillas.'),
      ('Goblet Squat', array['quads','glutes','core']::text[], array['dumbbell']::text[], 'Sostén la mancuerna junto al pecho, mantén el torso firme y alinea las rodillas con los pies.'),
      ('Sentadilla Búlgara con Mancuernas', array['quads','glutes','hamstrings']::text[], array['dumbbell','bench']::text[], 'Usa una zancada estable, baja con control y empuja el suelo con el pie delantero. Empieza sin peso si lo necesitas.'),
      ('Step-up con Mancuernas', array['quads','glutes']::text[], array['dumbbell','bench']::text[], 'Usa un banco bajo y estable. Sube impulsándote con la pierna de apoyo, sin saltar con el pie trasero.'),
      ('Romanian Deadlift (RDL)', array['hamstrings','glutes','back']::text[], array['dumbbell','barbell']::text[], 'Lleva la cadera atrás con espalda neutra y detén el recorrido antes de perder tensión o posición.'),
      ('Pull Through en Polea', array['hamstrings','glutes']::text[], array['cable']::text[], 'De espaldas a la polea baja, lleva la cadera atrás y extiéndela sin inclinarte hacia atrás al terminar.'),
      ('Hip Thrust con Mancuerna', array['glutes','hamstrings']::text[], array['dumbbell','bench']::text[], 'Apoya la espalda alta, empuja con los talones y termina con costillas abajo, sin hiperextender la zona lumbar.'),
      ('Puente de Glúteos', array['glutes','hamstrings']::text[], array['bodyweight','dumbbell']::text[], 'Con la espalda en el suelo, acerca los talones y eleva la cadera apretando glúteos sin arquear la espalda.'),
      ('Press Banca con Mancuernas', array['chest','shoulders','triceps']::text[], array['dumbbell','bench']::text[], 'Pies firmes y agarre neutro o cómodo. Mantén los codos a unos 45 grados y detén el recorrido si molesta la clavícula.'),
      ('Press Banca Inclinado Mancuernas', array['chest','shoulders','triceps']::text[], array['dumbbell','bench']::text[], 'Ajusta el banco a 30 grados, usa un agarre cómodo y baja las mancuernas de forma controlada.'),
      ('Remo con Mancuerna 1 Brazo', array['lats','upper_back','biceps']::text[], array['dumbbell','bench']::text[], 'Mantén la espalda estable y lleva la mancuerna hacia la cadera sin girar el torso.'),
      ('Remo Sentado en Polea', array['lats','upper_back','biceps']::text[], array['cable']::text[], 'Siéntate alto, inicia llevando los codos atrás y evita balancear el torso para mover más peso.'),
      ('Jalón al Pecho (Lat Pulldown)', array['lats','biceps','upper_back']::text[], array['cable']::text[], 'Lleva los codos abajo y atrás sin impulsar el torso ni jalar la barra detrás de la cabeza.'),
      ('Jalón Neutro al Pecho', array['lats','biceps','upper_back']::text[], array['cable']::text[], 'Usa un agarre con palmas enfrentadas. Baja hacia la parte alta del pecho sin encoger los hombros.'),
      ('Face Pull', array['rear_delts','traps','upper_back']::text[], array['cable']::text[], 'Jala la cuerda hacia el rostro y termina con los codos altos, sin arquear la espalda.'),
      ('Pájaros con Mancuernas', array['rear_delts','upper_back']::text[], array['dumbbell','bench']::text[], 'Inclina el torso con apoyo si es posible y abre los brazos con poco peso, sin encoger los hombros.'),
      ('Lateral Raise con Mancuernas', array['shoulders']::text[], array['dumbbell']::text[], 'Eleva hasta una altura cómoda sin balancear el cuerpo. Usa menos peso si aparece molestia en la clavícula.'),
      ('Elevación Lateral en Polea', array['shoulders']::text[], array['cable']::text[], 'Con la polea baja, eleva el brazo de forma controlada hasta una altura cómoda y evita inclinar el cuerpo.'),
      ('Curl Mancuernas Alternados', array['biceps','forearms']::text[], array['dumbbell']::text[], 'Mantén los codos junto al torso y sube sin balancearte. Baja lentamente.'),
      ('Curl Martillo con Mancuernas', array['biceps','forearms']::text[], array['dumbbell']::text[], 'Mantén las palmas enfrentadas y los codos quietos; evita usar impulso del tronco.'),
      ('Tríceps Push-down Cable', array['triceps']::text[], array['cable']::text[], 'Mantén los codos pegados al torso y extiende sin mover los hombros ni inclinarte sobre la polea.'),
      ('Extensión de Tríceps a 1 Brazo', array['triceps']::text[], array['cable']::text[], 'Con la polea alta, fija el codo junto al cuerpo y extiende hasta una posición cómoda.'),
      ('Elevación de Pantorrilla de Pie', array['calves']::text[], array['dumbbell','step']::text[], 'Sube sobre la punta de los pies, haz una pausa arriba y baja lento usando apoyo para mantener el equilibrio.'),
      ('Pantorrilla en Prensa', array['calves']::text[], array['leg_press']::text[], 'Coloca la parte delantera de los pies en la plataforma, conserva las rodillas suaves y mueve solo los tobillos.'),
      ('Dead Bug', array['core']::text[], array['bodyweight']::text[], 'Mantén la zona lumbar suavemente apoyada mientras extiendes brazo y pierna contrarios sin perder control.'),
      ('Pallof Press', array['core']::text[], array['cable']::text[], 'Colócate de lado a la polea, extiende los brazos y evita que el torso gire.' )
  ) as seed(name, muscle_groups, equipment, technique)
  where not exists (
    select 1
    from public.exercises existing
    where existing.user_id = v_user_id
      and existing.name = seed.name
      and existing.archived_at is null
  );

  update public.exercises primary_exercise
  set substitute_ids = coalesce((
    select array_agg(alternative.id order by alternative_name.ordinality)
    from unnest(pair.alternative_names) with ordinality as alternative_name(name, ordinality)
    join lateral (
      select id
      from public.exercises
      where user_id = v_user_id
        and name = alternative_name.name
        and archived_at is null
      order by created_at
      limit 1
    ) alternative on true
  ), '{}'::uuid[])
  from (
    values
      ('Prensa de Piernas', array['Goblet Squat']::text[]),
      ('Goblet Squat', array['Prensa de Piernas']::text[]),
      ('Sentadilla Búlgara con Mancuernas', array['Step-up con Mancuernas','Prensa de Piernas']::text[]),
      ('Step-up con Mancuernas', array['Sentadilla Búlgara con Mancuernas','Prensa de Piernas']::text[]),
      ('Romanian Deadlift (RDL)', array['Pull Through en Polea','Hip Thrust con Mancuerna']::text[]),
      ('Pull Through en Polea', array['Romanian Deadlift (RDL)','Hip Thrust con Mancuerna']::text[]),
      ('Hip Thrust con Mancuerna', array['Puente de Glúteos','Pull Through en Polea']::text[]),
      ('Puente de Glúteos', array['Hip Thrust con Mancuerna']::text[]),
      ('Press Banca con Mancuernas', array['Press Banca Inclinado Mancuernas']::text[]),
      ('Press Banca Inclinado Mancuernas', array['Press Banca con Mancuernas']::text[]),
      ('Remo con Mancuerna 1 Brazo', array['Remo Sentado en Polea']::text[]),
      ('Remo Sentado en Polea', array['Remo con Mancuerna 1 Brazo']::text[]),
      ('Jalón al Pecho (Lat Pulldown)', array['Jalón Neutro al Pecho']::text[]),
      ('Jalón Neutro al Pecho', array['Jalón al Pecho (Lat Pulldown)']::text[]),
      ('Face Pull', array['Pájaros con Mancuernas']::text[]),
      ('Pájaros con Mancuernas', array['Face Pull']::text[]),
      ('Lateral Raise con Mancuernas', array['Elevación Lateral en Polea']::text[]),
      ('Elevación Lateral en Polea', array['Lateral Raise con Mancuernas']::text[]),
      ('Curl Mancuernas Alternados', array['Curl Martillo con Mancuernas']::text[]),
      ('Curl Martillo con Mancuernas', array['Curl Mancuernas Alternados']::text[]),
      ('Tríceps Push-down Cable', array['Extensión de Tríceps a 1 Brazo']::text[]),
      ('Extensión de Tríceps a 1 Brazo', array['Tríceps Push-down Cable']::text[]),
      ('Elevación de Pantorrilla de Pie', array['Pantorrilla en Prensa']::text[]),
      ('Pantorrilla en Prensa', array['Elevación de Pantorrilla de Pie']::text[]),
      ('Dead Bug', array['Pallof Press']::text[]),
      ('Pallof Press', array['Dead Bug']::text[])
  ) as pair(primary_name, alternative_names)
  where primary_exercise.user_id = v_user_id
    and primary_exercise.name = pair.primary_name
    and primary_exercise.archived_at is null;

  insert into public.workout_plans (
    user_id,
    name,
    description,
    is_active,
    mesocycle_weeks,
    current_week
  ) values (
    v_user_id,
    'Plan atlético · 12 semanas',
    'Tres sesiones de cuerpo completo con énfasis en piernas y ganancia muscular. Lunes, miércoles y viernes, aproximadamente 45 minutos; cada sesión incluye una versión esencial de 20 minutos y alternativas por equipo o tolerancia.',
    true,
    12,
    1
  ) returning * into v_plan;

  insert into public.workout_templates (user_id, plan_id, name, position)
  values (v_user_id, v_plan.id, 'Lunes A · Pierna y base', 1)
  returning id into v_template_a;

  insert into public.workout_templates (user_id, plan_id, name, position)
  values (v_user_id, v_plan.id, 'Miércoles B · Unilateral y espalda', 2)
  returning id into v_template_b;

  insert into public.workout_templates (user_id, plan_id, name, position)
  values (v_user_id, v_plan.id, 'Viernes C · Volumen completo', 3)
  returning id into v_template_c;

  insert into public.workout_template_exercises (
    user_id, template_id, exercise_id, position, prescribed_sets,
    reps_min, reps_max, target_rpe, rest_seconds, is_warmup,
    superset_with_position, notes
  )
  select
    v_user_id, v_template_a, exercise.id, prescription.position,
    prescription.prescribed_sets, prescription.reps_min, prescription.reps_max,
    prescription.target_rpe, prescription.rest_seconds, false,
    prescription.superset_with_position, prescription.notes
  from (
    values
      ('Prensa de Piernas', 1, 3, 8, 12, 7, 120, null::int, 'Empieza ligero. Esta es la prioridad del día para desarrollar piernas.'),
      ('Press Banca con Mancuernas', 2, 3, 8, 12, 7, 90, null::int, 'Usa agarre cómodo y detén la serie si la clavícula derecha supera una molestia leve.'),
      ('Remo con Mancuerna 1 Brazo', 3, 3, 10, 12, 7, 75, null::int, 'Repeticiones por brazo; completa este ejercicio para cerrar la versión de 20 min.'),
      ('Romanian Deadlift (RDL)', 4, 3, 8, 10, 7, 120, null::int, 'Recorrido corto al inicio; prioriza sentir isquios y glúteos.'),
      ('Lateral Raise con Mancuernas', 5, 2, 12, 15, 7, 45, 6, 'Superset opcional con pantorrilla; usa poco peso.'),
      ('Elevación de Pantorrilla de Pie', 6, 3, 12, 15, 7, 45, 5, 'Pausa arriba y bajada lenta.')
  ) as prescription(exercise_name, position, prescribed_sets, reps_min, reps_max, target_rpe, rest_seconds, superset_with_position, notes)
  join lateral (
    select id from public.exercises
    where user_id = v_user_id and name = prescription.exercise_name and archived_at is null
    order by created_at limit 1
  ) exercise on true;

  insert into public.workout_template_exercises (
    user_id, template_id, exercise_id, position, prescribed_sets,
    reps_min, reps_max, target_rpe, rest_seconds, is_warmup,
    superset_with_position, notes
  )
  select
    v_user_id, v_template_b, exercise.id, prescription.position,
    prescription.prescribed_sets, prescription.reps_min, prescription.reps_max,
    prescription.target_rpe, prescription.rest_seconds, false,
    prescription.superset_with_position, prescription.notes
  from (
    values
      ('Sentadilla Búlgara con Mancuernas', 1, 3, 8, 10, 7, 90, null::int, 'Repeticiones por pierna. Empieza sin peso hasta dominar el equilibrio.'),
      ('Jalón al Pecho (Lat Pulldown)', 2, 3, 8, 12, 7, 90, null::int, 'Sin impulso; lleva los codos hacia abajo.'),
      ('Press Banca Inclinado Mancuernas', 3, 3, 8, 12, 7, 90, null::int, 'Banco bajo y agarre cómodo; completa este ejercicio para cerrar la versión de 20 min.'),
      ('Hip Thrust con Mancuerna', 4, 3, 10, 12, 7, 90, null::int, 'Pausa de un segundo arriba sin arquear la espalda.'),
      ('Face Pull', 5, 2, 12, 15, 7, 45, 6, 'Superset opcional con abdomen; movimiento ligero y controlado.'),
      ('Dead Bug', 6, 3, 6, 10, 6, 45, 5, 'Repeticiones lentas por lado. Detén antes de separar la espalda del suelo.')
  ) as prescription(exercise_name, position, prescribed_sets, reps_min, reps_max, target_rpe, rest_seconds, superset_with_position, notes)
  join lateral (
    select id from public.exercises
    where user_id = v_user_id and name = prescription.exercise_name and archived_at is null
    order by created_at limit 1
  ) exercise on true;

  insert into public.workout_template_exercises (
    user_id, template_id, exercise_id, position, prescribed_sets,
    reps_min, reps_max, target_rpe, rest_seconds, is_warmup,
    superset_with_position, notes
  )
  select
    v_user_id, v_template_c, exercise.id, prescription.position,
    prescription.prescribed_sets, prescription.reps_min, prescription.reps_max,
    prescription.target_rpe, prescription.rest_seconds, false,
    prescription.superset_with_position, prescription.notes
  from (
    values
      ('Prensa de Piernas', 1, 3, 10, 15, 7, 120, null::int, 'Usa una carga menor que el lunes y busca repeticiones limpias.'),
      ('Hip Thrust con Mancuerna', 2, 3, 10, 15, 7, 90, null::int, 'Controla la bajada y pausa arriba.'),
      ('Jalón al Pecho (Lat Pulldown)', 3, 3, 10, 12, 7, 75, null::int, 'Completa este ejercicio para cerrar la versión de 20 min.'),
      ('Press Banca con Mancuernas', 4, 3, 10, 12, 7, 75, null::int, 'Carga moderada y agarre cómodo.'),
      ('Curl Mancuernas Alternados', 5, 2, 10, 15, 7, 45, 6, 'Superset opcional con tríceps.'),
      ('Tríceps Push-down Cable', 6, 2, 10, 15, 7, 45, 5, 'Mantén los codos fijos y evita inclinarte.')
  ) as prescription(exercise_name, position, prescribed_sets, reps_min, reps_max, target_rpe, rest_seconds, superset_with_position, notes)
  join lateral (
    select id from public.exercises
    where user_id = v_user_id and name = prescription.exercise_name and archived_at is null
    order by created_at limit 1
  ) exercise on true;

  insert into public.plan_schedule_slots (
    user_id, plan_id, day_of_week, template_id, activity_label
  ) values
    (v_user_id, v_plan.id, 1, v_template_a, null),
    (v_user_id, v_plan.id, 2, null, 'Tenis · 60 min o descanso'),
    (v_user_id, v_plan.id, 3, v_template_b, null),
    (v_user_id, v_plan.id, 4, null, 'Tenis · 60 min o descanso'),
    (v_user_id, v_plan.id, 5, v_template_c, null),
    (v_user_id, v_plan.id, 6, null, 'Descanso · cardio suave opcional'),
    (v_user_id, v_plan.id, 0, null, 'Descanso');

  return v_plan;
end;
$$;

revoke all on function public.install_personalized_workout_plan(boolean) from public, anon;
grant execute on function public.install_personalized_workout_plan(boolean) to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
