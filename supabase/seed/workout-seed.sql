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
    (v_user, 'Goblet Squat', 'strength', '{quads,glutes,core}', '{dumbbell}',
     'Mancuerna pegada al pecho con ambas manos. Pies a ancho de hombros, puntas ligero afuera. Bajar manteniendo torso erguido, codos por dentro de las rodillas en el fondo.',
     true) returning id into v_goblet_squat;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Sentadilla con Barra', 'strength', '{quads,glutes,hamstrings,core}', '{barbell,rack}',
     'Barra apoyada en trapecio (high bar). Pies a ancho de hombros. Bajar como si te sentaras hacia atrás, mantén pecho arriba, rodillas siguiendo línea de pies. Profundidad: cadera bajo paralelo.',
     true) returning id into v_back_squat;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Front Squat', 'strength', '{quads,core}', '{barbell,rack}',
     'Barra al frente apoyada en deltoides anterior, codos altos. Más demanda en cuádriceps y core que sentadilla trasera.',
     true) returning id into v_front_squat;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Hack Squat', 'strength', '{quads,glutes}', '{machine}',
     'Máquina con respaldo a 45°. Pies altos = más glúteo, pies abajo = más cuádriceps.',
     true) returning id into v_hack_squat;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Leg Press', 'strength', '{quads,glutes,hamstrings}', '{machine}',
     'Espalda baja PEGADA al respaldo siempre (sino daño lumbar). No bloquees rodillas arriba.',
     true) returning id into v_leg_press;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Peso Muerto Convencional', 'strength', '{hamstrings,glutes,back,core}', '{barbell}',
     'Barra sobre medio del pie. Cadera arriba, espalda neutra, hombros sobre barra. Empujar piso con pies, NO jalar la barra. Cadera y hombros suben juntos.',
     true) returning id into v_deadlift;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Romanian Deadlift (RDL)', 'strength', '{hamstrings,glutes,back}', '{dumbbell,barbell}',
     'Rodillas ligeramente flexionadas (no se mueven más). Empujar cadera ATRÁS, no doblar rodillas. Espalda neutra. Sentirás estiramiento en isquios.',
     true) returning id into v_rdl;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Sumo Deadlift', 'strength', '{quads,glutes,hamstrings}', '{barbell}',
     'Pies muy abiertos, puntas afuera. Manos dentro de las rodillas. Más cuádriceps, menos espalda baja que convencional.',
     true) returning id into v_sumo_dl;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Hip Thrust con Mancuerna', 'strength', '{glutes,hamstrings}', '{dumbbell,bench}',
     'Espalda alta apoyada en banco, mancuerna sobre cadera. Empuja con talones, contrae glúteo arriba 1 segundo.',
     true) returning id into v_hip_thrust;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Glute Bridge', 'strength', '{glutes}', '{bodyweight}',
     'Acostado, rodillas dobladas, pies en piso. Empuja con talones, contrae glúteo arriba.',
     true) returning id into v_glute_bridge;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Press Banca con Mancuernas', 'strength', '{chest,shoulders,triceps}', '{dumbbell,bench}',
     'Mancuernas a los lados del pecho, codos a ~45° (no 90°). Bajar controlado, empujar fuerte. Mejor ROM y más seguro que barra para principiante.',
     true) returning id into v_bench_db;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Press Banca con Barra', 'strength', '{chest,shoulders,triceps}', '{barbell,bench,rack}',
     'Barra al medio del pecho, codos a 45°. Pies firmes en el piso. Siempre con observador o en rack con seguros.',
     true) returning id into v_bench_bb;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Push-ups', 'strength', '{chest,shoulders,triceps,core}', '{bodyweight}',
     'Manos a ancho de hombros. Cuerpo recto como tabla. Bajar pecho hasta cerca del piso. Eleva pies en banco para hacer más difícil.',
     true) returning id into v_pushup;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Press Banca Inclinado Mancuernas', 'strength', '{chest,shoulders,triceps}', '{dumbbell,bench}',
     'Banco a 30-45°. Énfasis en pecho superior. Mancuernas más perdonadoras que barra inclinada.',
     true) returning id into v_incline_bench_db;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Press Banca Inclinado Barra', 'strength', '{chest,shoulders,triceps}', '{barbell,bench,rack}',
     'Banco a 30°. Más estable que mancuernas, más peso posible.',
     true) returning id into v_incline_bench_bb;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Press Militar Mancuernas Sentado', 'strength', '{shoulders,triceps,core}', '{dumbbell,bench}',
     'Sentado en banco a 90° (apoya espalda). Mancuernas a la altura de los hombros, palmas adelante. Empuja arriba sin arquear espalda.',
     true) returning id into v_ohp_db_seated;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Press Militar con Barra (OHP)', 'strength', '{shoulders,triceps,core}', '{barbell,rack}',
     'De pie, barra a la altura de la clavícula. Aprieta glúteos y core. Empuja arriba, mete cabeza adelante al final.',
     true) returning id into v_ohp_bb;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Arnold Press', 'strength', '{shoulders,triceps}', '{dumbbell,bench}',
     'Sentado. Mancuernas al frente con palmas hacia ti, rotar a palmas adelante mientras empujas arriba.',
     true) returning id into v_arnold_press;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Lateral Raise con Mancuernas', 'strength', '{shoulders}', '{dumbbell}',
     'Mancuernas a los lados. Sube los brazos hasta la altura de los hombros, codo ligeramente flexionado. Sin balanceo.',
     true) returning id into v_lateral_raise_db;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Cable Lateral Raise', 'strength', '{shoulders}', '{cable}',
     'Polea baja, cable cruza por delante del cuerpo. Más tensión constante que mancuerna.',
     true) returning id into v_cable_lateral;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Face Pull', 'strength', '{rear_delts,traps,upper_back}', '{cable}',
     'Polea alta con cuerda. Jalar a la cara, codos altos, separar las cuerdas a los lados de la cara. Crítico para postura encorvada.',
     true) returning id into v_face_pull;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Reverse Fly Mancuernas', 'strength', '{rear_delts,upper_back}', '{dumbbell,bench}',
     'Inclinado en banco a 45°, mancuernas colgando. Abre brazos a los lados manteniendo codos ligeramente flexionados.',
     true) returning id into v_rear_fly_db;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Jalón al Pecho (Lat Pulldown)', 'strength', '{lats,biceps,upper_back}', '{cable}',
     'Polea alta con barra. Sentado, jalar barra al pecho superior. Pecho arriba, codos hacia abajo y atrás.',
     true) returning id into v_lat_pulldown;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Pull-up', 'strength', '{lats,biceps,upper_back}', '{pullup_bar}',
     'Agarre prono, manos a ancho de hombros o un poco más. Subir hasta que la barbilla pase la barra. Control en bajada.',
     true) returning id into v_pullup;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Chin-up', 'strength', '{biceps,lats}', '{pullup_bar}',
     'Agarre supino (palmas hacia ti). Más fácil que pull-up, más bíceps.',
     true) returning id into v_chinup;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Remo con Mancuerna 1 Brazo', 'strength', '{lats,upper_back,biceps}', '{dumbbell,bench}',
     'Una rodilla y mano en banco. Espalda paralela al piso. Jalar mancuerna al ombligo, codo cerca del cuerpo. No rotar torso.',
     true) returning id into v_db_row;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Remo con Barra Inclinado', 'strength', '{lats,upper_back,biceps,core}', '{barbell}',
     'Inclinado al frente ~45°, espalda neutra. Jalar barra al ombligo. Más tasa pero más demanda lumbar.',
     true) returning id into v_bb_row;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'T-Bar Row', 'strength', '{lats,upper_back}', '{barbell,landmine}',
     'Una punta de barra fija, jalar el otro extremo con triángulo. Buena alternativa al remo barra para espalda media.',
     true) returning id into v_tbar_row;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Curl Mancuernas Alternados', 'strength', '{biceps}', '{dumbbell}',
     'De pie, mancuernas a los lados, palmas hacia adelante. Curlear una mancuerna a la vez sin balancear el cuerpo.',
     true) returning id into v_curl_db;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Hammer Curl', 'strength', '{biceps,forearms}', '{dumbbell}',
     'Igual que curl pero con palmas hacia adentro (martillo). Más braquial, antebrazo, y se siente más fuerte.',
     true) returning id into v_hammer_curl;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Tríceps Push-down Cable', 'strength', '{triceps}', '{cable}',
     'Polea alta con cuerda o barra. Codos pegados al cuerpo. Empuja cable abajo extendiendo solo el codo.',
     true) returning id into v_tricep_pushdown;
  insert into public.exercises (user_id, name, exercise_type, muscle_groups, equipment, technique, is_seed) values
    (v_user, 'Skull Crusher (Tricep Extension)', 'strength', '{triceps}', '{dumbbell,bench}',
     'Acostado en banco, mancuernas arriba. Bajar SOLO con los codos hasta la frente, mantén codos quietos. Subir extendiendo.',
     true) returning id into v_skull_crusher;

  -- ===== SUBSTITUTES =====
  update public.exercises set substitute_ids = array[v_front_squat, v_hack_squat, v_leg_press, v_goblet_squat]::uuid[] where id = v_back_squat;
  update public.exercises set substitute_ids = array[v_back_squat, v_hack_squat]::uuid[] where id = v_front_squat;
  update public.exercises set substitute_ids = array[v_back_squat, v_front_squat]::uuid[] where id = v_hack_squat;
  update public.exercises set substitute_ids = array[v_back_squat, v_hack_squat]::uuid[] where id = v_leg_press;
  update public.exercises set substitute_ids = array[v_back_squat, v_leg_press]::uuid[] where id = v_goblet_squat;
  update public.exercises set substitute_ids = array[v_rdl, v_sumo_dl]::uuid[] where id = v_deadlift;
  update public.exercises set substitute_ids = array[v_deadlift, v_hip_thrust]::uuid[] where id = v_rdl;
  update public.exercises set substitute_ids = array[v_deadlift]::uuid[] where id = v_sumo_dl;
  update public.exercises set substitute_ids = array[v_glute_bridge, v_rdl]::uuid[] where id = v_hip_thrust;
  update public.exercises set substitute_ids = array[v_hip_thrust]::uuid[] where id = v_glute_bridge;
  update public.exercises set substitute_ids = array[v_bench_bb, v_pushup, v_incline_bench_db]::uuid[] where id = v_bench_db;
  update public.exercises set substitute_ids = array[v_bench_db, v_pushup]::uuid[] where id = v_bench_bb;
  update public.exercises set substitute_ids = array[v_bench_db, v_bench_bb]::uuid[] where id = v_pushup;
  update public.exercises set substitute_ids = array[v_incline_bench_bb, v_bench_db]::uuid[] where id = v_incline_bench_db;
  update public.exercises set substitute_ids = array[v_incline_bench_db, v_bench_bb]::uuid[] where id = v_incline_bench_bb;
  update public.exercises set substitute_ids = array[v_ohp_bb, v_arnold_press, v_lateral_raise_db]::uuid[] where id = v_ohp_db_seated;
  update public.exercises set substitute_ids = array[v_ohp_db_seated, v_arnold_press]::uuid[] where id = v_ohp_bb;
  update public.exercises set substitute_ids = array[v_ohp_db_seated, v_ohp_bb]::uuid[] where id = v_arnold_press;
  update public.exercises set substitute_ids = array[v_cable_lateral]::uuid[] where id = v_lateral_raise_db;
  update public.exercises set substitute_ids = array[v_lateral_raise_db]::uuid[] where id = v_cable_lateral;
  update public.exercises set substitute_ids = array[v_rear_fly_db]::uuid[] where id = v_face_pull;
  update public.exercises set substitute_ids = array[v_face_pull]::uuid[] where id = v_rear_fly_db;
  update public.exercises set substitute_ids = array[v_pullup, v_chinup]::uuid[] where id = v_lat_pulldown;
  update public.exercises set substitute_ids = array[v_lat_pulldown, v_chinup]::uuid[] where id = v_pullup;
  update public.exercises set substitute_ids = array[v_pullup, v_lat_pulldown]::uuid[] where id = v_chinup;
  update public.exercises set substitute_ids = array[v_bb_row, v_tbar_row]::uuid[] where id = v_db_row;
  update public.exercises set substitute_ids = array[v_db_row, v_tbar_row]::uuid[] where id = v_bb_row;
  update public.exercises set substitute_ids = array[v_db_row, v_bb_row]::uuid[] where id = v_tbar_row;
  update public.exercises set substitute_ids = array[v_hammer_curl]::uuid[] where id = v_curl_db;
  update public.exercises set substitute_ids = array[v_curl_db]::uuid[] where id = v_hammer_curl;
  update public.exercises set substitute_ids = array[v_skull_crusher]::uuid[] where id = v_tricep_pushdown;
  update public.exercises set substitute_ids = array[v_tricep_pushdown]::uuid[] where id = v_skull_crusher;

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
-- This catalog requires an administrative SQL session. Authenticated users
-- can install their personal workout without failing on the global rows.
-- =====================================================

do $$
begin
  if auth.uid() is not null then
    raise notice 'Skipping global daily tips for authenticated workout seed';
    return;
  end if;

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
end
$$;
