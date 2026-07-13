-- =====================================================
-- HABIT SEED: default habits based on health knowledge base
-- One-time seed. Prefer apply-all.sql for repeatable, non-destructive updates.
-- Run AFTER auth.users has at least one user.
-- =====================================================

do $$
declare uid uuid;
begin
  select id into uid from auth.users limit 1;
  if uid is null then
    raise notice 'No users found — skipping habit seed.';
    return;
  end if;

  if exists (select 1 from public.habits where user_id = uid) then
    raise notice 'Habits already exist for user % — skipping.', uid;
    return;
  end if;

  insert into public.habits (user_id, name, emoji, description, time_of_day, days_of_week, "order") values
    -- Mañana
    (uid, 'Luz solar 10 min',                    '☀️',  'En los primeros 30 min del día. Calibra cortisol y circadiano.',         'manana',    '{0,1,2,3,4,5,6}', 0),
    (uid, '30g proteína al despertar',            '🥩',  'En los primeros 60 min. Estabiliza glucosa → cortisol controlado.',      'manana',    '{0,1,2,3,4,5,6}', 1),
    (uid, 'Café 90 min después de despertar',     '☕',  'No en el pico de cortisol. Evita crash de tarde y dependencia.',         'manana',    '{0,1,2,3,4,5,6}', 2),
    (uid, 'Physiological sigh (×3)',              '😮‍💨', 'Doble inhala nasal + exhala lenta. Activa parasimpático en segundos.',  'manana',    '{0,1,2,3,4,5,6}', 3),
    -- Técnicas vagales (cualquier momento)
    (uid, 'Tararear 2 min',                       '🎵',  'Vibración en garganta activa nervio vago. Reduce cortisol.',             'cualquier', '{0,1,2,3,4,5,6}', 0),
    (uid, 'Sacar lengua 40s (×2)',                '👅',  'Descomprime cadena fascial mandíbula → cuello → pecho.',                 'cualquier', '{0,1,2,3,4,5,6}', 1),
    (uid, 'Respiración de coherencia 10 min',     '🌬️',  '5.5 resp/min (inhala 5.5s + exhala 5.5s). Sube HRV.',                  'cualquier', '{0,1,2,3,4,5,6}', 2),
    -- Noche
    (uid, 'Sin pantallas 60 min antes de dormir', '📵',  'Luz azul → cortisol nocturno → sueño fragmentado.',                     'noche',     '{0,1,2,3,4,5,6}', 0),
    (uid, 'Sin comida 3h antes de dormir',        '🍽️',  'Mejora calidad de sueño y autofagia nocturna.',                         'noche',     '{0,1,2,3,4,5,6}', 1),
    (uid, 'Caminar 10 min post-comida',           '🚶',  'Bluntea el pico de glucosa post-prandial.',                              'tarde',     '{0,1,2,3,4,5,6}', 0);

  raise notice 'Habit seed complete for user %', uid;
end$$;
