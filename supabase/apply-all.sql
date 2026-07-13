-- ============================================================
-- SETUP CONSOLIDADO — Pega TODO esto en el SQL Editor de Supabase
-- (Dashboard → SQL Editor → New query → pega → Run)
--
-- Es idempotente y no borra datos: puedes correrlo varias veces.
-- Hace 4 cosas:
--   1. Crea tablas de hábitos (si no existen)
--   2. Actualiza los horarios de suplementos (ayunas/desayuno/cena/noche/dormir)
--   3. Inserta o actualiza el catálogo curado por nombre
--   4. Inserta o actualiza los hábitos por defecto por nombre
-- ============================================================

-- ============================================================
-- 1. TABLAS DE HÁBITOS
-- ============================================================
create table if not exists public.habits (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  name          text        not null,
  description   text,
  emoji         text,
  time_of_day   text        not null check (time_of_day in ('manana','tarde','noche','cualquier')),
  days_of_week  int[]       not null default '{0,1,2,3,4,5,6}',
  active        boolean     not null default true,
  "order"       int         not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists habits_user_active on public.habits(user_id, active);

create table if not exists public.habit_logs (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  habit_id      uuid        not null references public.habits(id) on delete cascade,
  completed_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists habit_logs_user_date on public.habit_logs(user_id, completed_at);
create index if not exists habit_logs_habit    on public.habit_logs(habit_id);
create unique index if not exists habits_user_name_unique
  on public.habits(user_id, name);

-- La app exige sesión y cada usuario solo puede acceder a sus propias filas.
alter table public.habits     enable row level security;
alter table public.habit_logs enable row level security;

do $$
declare t text;
begin
  foreach t in array array['habits', 'habit_logs']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format('create policy %I on public.%I for select to authenticated using (auth.uid() = user_id)', t || '_select_own', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (auth.uid() = user_id)', t || '_insert_own', t);
    execute format('create policy %I on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t || '_update_own', t);
    execute format('create policy %I on public.%I for delete to authenticated using (auth.uid() = user_id)', t || '_delete_own', t);
  end loop;
end$$;

drop trigger if exists habits_set_updated_at on public.habits;
create trigger habits_set_updated_at before update on public.habits
  for each row execute function public.tg_set_updated_at();

-- ============================================================
-- 2. HORARIOS DE SUPLEMENTOS — nuevos valores
--    ayunas | desayuno | cena | noche | antes_dormir
-- ============================================================
alter table public.supplement_schedules
  drop constraint if exists supplement_schedules_time_of_day_check;

-- Remapear datos viejos por si quedaran
update public.supplement_schedules set time_of_day = 'ayunas'   where time_of_day = 'manana';
update public.supplement_schedules set time_of_day = 'desayuno' where time_of_day = 'con_comida';
update public.supplement_schedules set time_of_day = 'cena'     where time_of_day in ('tarde','mediodia');

alter table public.supplement_schedules
  add constraint supplement_schedules_time_of_day_check
  check (time_of_day in ('ayunas','desayuno','cena','noche','antes_dormir'));

-- ============================================================
-- 3 + 4. SEED NO DESTRUCTIVO (catálogo de suplementos + hábitos)
-- ============================================================
create unique index if not exists supplements_user_name_unique
  on public.supplements(user_id, name);
create unique index if not exists supplement_stacks_user_name_unique
  on public.supplement_stacks(user_id, name);
create unique index if not exists supplement_schedules_slot_unique
  on public.supplement_schedules(supplement_id, time_of_day);

do $$
declare uid uuid;
begin
  -- App de un solo usuario: usa la cuenta de Auth existente.
  select id into uid from auth.users order by created_at asc limit 1;
  if uid is null then
    raise notice 'No hay usuarios — abortando seed.';
    return;
  end if;

  -- ---- Catálogo (25 ítems) ----
  insert into public.supplements (user_id, name, form, dose_amount, dose_unit, category, notes, active, is_seed) values
    (uid, 'Creatina',           'polvo',   5,    'g',   'aminoacido', 'Monohidrato. Disuelta en agua. Todos los días.',                     true, true),
    (uid, 'Vitamina D3',        'softgel', 6000, 'IU',  'vitamina',   'Con grasa para mejor absorción. Junto con K2.',                      true, true),
    (uid, 'Vitamina K2 MK-7',   'softgel', 100,  'mcg', 'vitamina',   'Sinergia con D3. Tomar juntos.',                                     true, true),
    (uid, 'Omega-3',            'softgel', 2000, 'mg',  'omega',      'EPA/DHA. Con comida.',                                               true, true),
    (uid, 'Magnesio Glicinato', 'capsula', 400,  'mg',  'mineral',    'Antes de dormir. Sueño, cortisol, energía.',                         true, true),
    (uid, 'Berberina',          'capsula', 500,  'mg',  'herb',       'Con el desayuno. Controla el pico de glucosa de la primera comida.', true, true),
    (uid, 'NAD+',               'capsula', 250,  'mg',  'otro',       'Mañana. Energía celular, reparación de DNA.',                        true, true),
    (uid, 'Adaptógenos',        'capsula', 600,  'mg',  'herb',       'Ashwagandha KSM-66 o Rhodiola.',                                     true, true),
    (uid, 'Enzimas digestivas', 'capsula', 1,    'g',   'otro',       'Con la cena (la comida más pesada).',                                true, true),
    (uid, 'Probiótico',         'capsula', 1,    'g',   'probiotico', 'En ayunas.',                                                         true, true),
    (uid, 'Glicina',            'polvo',   5,    'g',   'aminoacido', 'Antes de dormir. Sueño profundo. Con NAC = GlyNAC.',                 true, true),
    (uid, 'NAC',                'capsula', 600,  'mg',  'aminoacido', 'Mañana. Con glicina = GlyNAC.',                                      true, true),
    (uid, 'Zinc',               'capsula', 15,   'mg',  'mineral',    'Noche. Libido, testosterona, recuperación. No con magnesio.',        true, true),
    (uid, 'Tiamina B1',         'capsula', 100,  'mg',  'vitamina',   'Mañana. Energía celular, nervios. Tier S.',                          true, true),
    (uid, 'Psyllium Husk',      'polvo',   5,    'g',   'otro',       'En ayunas con vaso grande de agua. Separado del resto.',             true, true),
    (uid, 'CoQ10',              'softgel', 200,  'mg',  'otro',       'Con el desayuno (liposoluble, en la mañana).',                       true, true),
    (uid, 'Cúrcuma',            'capsula', 500,  'mg',  'herb',       'Con la cena, siempre con pimienta negra.',                           true, true),
    (uid, 'Pimienta Negra',     'capsula', 5,    'mg',  'herb',       'Junto a cúrcuma. Multiplica biodisponibilidad 20x.',                 true, true),
    (uid, 'Aceite de Orégano',  'liquido', 500,  'mg',  'herb',       'Antimicrobiano gut. Con la cena.',                                   true, true),
    (uid, 'Bone Broth',         'liquido', 240,  'ml',  'otro',       'Colágeno, gut healing, glicina natural.',                            true, true),
    (uid, 'Aceite de Oliva',    'liquido', 15,   'ml',  'otro',       'Extra virgen. Con la cena. Polifenoles.',                            true, true),
    (uid, 'Jengibre',           'capsula', 500,  'mg',  'herb',       'Anti-inflamatorio, digestión, testosterona.',                       true, true),
    (uid, 'Ajo',                'capsula', 600,  'mg',  'herb',       'Cardiovascular, antimicrobiano. Con la cena.',                       true, true),
    (uid, 'Tés',                'liquido', 240,  'ml',  'otro',       'Verde, matcha, rooibos. Polifenoles, L-teanina.',                    true, true)
  on conflict (user_id, name) do update set
    form = excluded.form,
    dose_amount = excluded.dose_amount,
    dose_unit = excluded.dose_unit,
    category = excluded.category,
    notes = excluded.notes,
    is_seed = true;

  -- ---- Schedules ----
  -- days_of_week: 0=Dom 1=Lun 2=Mar 3=Mié 4=Jue 5=Vie 6=Sáb
  -- DIARIO {0,1,2,3,4,5,6} · L/X/V {1,3,5} · L-V {1,2,3,4,5}
  -- Ma/J/S {2,4,6} · Ma/V {2,5} · S/D {0,6}

  -- En ayunas — diario: Probiótico, Tés | L/X/V: Psyllium | S/D: Bone Broth
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week)
    select s.id, uid, 'ayunas',
           case when s.name = 'Psyllium Husk' then '{1,3,5}'::int[]
                when s.name = 'Bone Broth'    then '{0,6}'::int[]
                else '{0,1,2,3,4,5,6}'::int[] end
    from public.supplements s
    where s.user_id = uid and s.name in ('Probiótico','Tés','Psyllium Husk','Bone Broth')
    on conflict (supplement_id, time_of_day) do update set
      days_of_week = excluded.days_of_week, user_id = excluded.user_id;

  -- Con el desayuno — diario salvo: NAC/NAD+ {1,3,5}, Adaptógenos {1-5}, Jengibre {2,4,6}
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week)
    select s.id, uid, 'desayuno',
           case when s.name in ('NAC','NAD+') then '{1,3,5}'::int[]
                when s.name = 'Adaptógenos'   then '{1,2,3,4,5}'::int[]
                when s.name = 'Jengibre'      then '{2,4,6}'::int[]
                else '{0,1,2,3,4,5,6}'::int[] end
    from public.supplements s
    where s.user_id = uid and s.name in
      ('Creatina','Vitamina D3','Vitamina K2 MK-7','Omega-3','NAD+','NAC','Tiamina B1','Adaptógenos','Jengibre','Berberina','CoQ10')
    on conflict (supplement_id, time_of_day) do update set
      days_of_week = excluded.days_of_week, user_id = excluded.user_id;

  -- Con la cena — diario: Aceite de Oliva | Ma/J/S: Cúrcuma+Pimienta, Ajo
  -- Ma/V: Orégano | S/D: Enzimas
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week)
    select s.id, uid, 'cena',
           case when s.name in ('Cúrcuma','Pimienta Negra','Ajo') then '{2,4,6}'::int[]
                when s.name = 'Aceite de Orégano'   then '{2,5}'::int[]
                when s.name = 'Enzimas digestivas'  then '{0,6}'::int[]
                else '{0,1,2,3,4,5,6}'::int[] end
    from public.supplements s
    where s.user_id = uid and s.name in
      ('Cúrcuma','Pimienta Negra','Enzimas digestivas','Aceite de Oliva','Ajo','Aceite de Orégano')
    on conflict (supplement_id, time_of_day) do update set
      days_of_week = excluded.days_of_week, user_id = excluded.user_id;

  -- Por la noche — Zinc L/X/V
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week)
    select s.id, uid, 'noche', '{1,3,5}' from public.supplements s
    where s.user_id = uid and s.name in ('Zinc')
    on conflict (supplement_id, time_of_day) do update set
      days_of_week = excluded.days_of_week, user_id = excluded.user_id;

  -- Antes de dormir — diario
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week)
    select s.id, uid, 'antes_dormir', '{0,1,2,3,4,5,6}' from public.supplements s
    where s.user_id = uid and s.name in ('Magnesio Glicinato','Glicina')
    on conflict (supplement_id, time_of_day) do update set
      days_of_week = excluded.days_of_week, user_id = excluded.user_id;

  -- ---- Stacks ----
  insert into public.supplement_stacks (user_id, name, description) values
    (uid, 'Stack Ayunas',   'Probiótico, Psyllium, Tés — estómago vacío'),
    (uid, 'Stack Desayuno', 'D3+K2, Creatina, Omega-3, NAD+, Tiamina, NAC, Jengibre, Adaptógenos, Berberina, CoQ10'),
    (uid, 'Stack Cena',     'Cúrcuma+Pimienta, Enzimas, Aceite de Oliva, Bone Broth, Ajo, Orégano'),
    (uid, 'Stack Dormir',   'Magnesio Glicinato, Glicina, Zinc')
  on conflict (user_id, name) do update set description = excluded.description;

  insert into public.supplement_stack_items (stack_id, supplement_id, "order")
    select st.id, s.id, row_number() over (order by s.name) - 1
    from public.supplement_stacks st join public.supplements s on s.user_id = uid
    where st.user_id = uid and st.name = 'Stack Ayunas'
      and s.name in ('Probiótico','Psyllium Husk','Tés')
    on conflict (stack_id, supplement_id) do update set "order" = excluded."order";

  insert into public.supplement_stack_items (stack_id, supplement_id, "order")
    select st.id, s.id, row_number() over (order by s.name) - 1
    from public.supplement_stacks st join public.supplements s on s.user_id = uid
    where st.user_id = uid and st.name = 'Stack Desayuno'
      and s.name in ('Creatina','Vitamina D3','Vitamina K2 MK-7','Omega-3','NAD+','NAC','Tiamina B1','Adaptógenos','Jengibre','Berberina','CoQ10')
    on conflict (stack_id, supplement_id) do update set "order" = excluded."order";

  insert into public.supplement_stack_items (stack_id, supplement_id, "order")
    select st.id, s.id, row_number() over (order by s.name) - 1
    from public.supplement_stacks st join public.supplements s on s.user_id = uid
    where st.user_id = uid and st.name = 'Stack Cena'
      and s.name in ('Cúrcuma','Pimienta Negra','Enzimas digestivas','Aceite de Oliva','Bone Broth','Ajo','Aceite de Orégano')
    on conflict (stack_id, supplement_id) do update set "order" = excluded."order";

  insert into public.supplement_stack_items (stack_id, supplement_id, "order")
    select st.id, s.id, row_number() over (order by s.name) - 1
    from public.supplement_stacks st join public.supplements s on s.user_id = uid
    where st.user_id = uid and st.name = 'Stack Dormir'
      and s.name in ('Magnesio Glicinato','Glicina','Zinc')
    on conflict (stack_id, supplement_id) do update set "order" = excluded."order";

  -- ---- Hábitos (inserta o actualiza defaults; conserva logs y estado activo) ----
  insert into public.habits (user_id, name, emoji, description, time_of_day, days_of_week, "order") values
    (uid, 'Luz solar 10 min',                    '☀️',  'En los primeros 30 min del día. Calibra cortisol y circadiano.',        'manana',    '{0,1,2,3,4,5,6}', 0),
    (uid, '30g proteína al despertar',            '🥩',  'En los primeros 60 min. Estabiliza glucosa → cortisol controlado.',     'manana',    '{0,1,2,3,4,5,6}', 1),
    (uid, 'Café 90 min después de despertar',     '☕',  'No en el pico de cortisol. Evita crash de tarde.',                      'manana',    '{0,1,2,3,4,5,6}', 2),
    (uid, 'Physiological sigh (×3)',              '😮‍💨', 'Doble inhala nasal + exhala lenta. Activa parasimpático.',             'manana',    '{0,1,2,3,4,5,6}', 3),
    (uid, 'Tararear 2 min',                       '🎵',  'Vibración en garganta activa nervio vago. Reduce cortisol.',            'cualquier', '{0,1,2,3,4,5,6}', 0),
    (uid, 'Sacar lengua 40s (×2)',                '👅',  'Descomprime cadena fascial mandíbula → cuello → pecho.',                'cualquier', '{0,1,2,3,4,5,6}', 1),
    (uid, 'Respiración de coherencia 10 min',     '🌬️',  '5.5 resp/min (inhala 5.5s + exhala 5.5s). Sube HRV.',                 'cualquier', '{0,1,2,3,4,5,6}', 2),
    (uid, 'Caminar 10 min post-comida',           '🚶',  'Bluntea el pico de glucosa post-prandial.',                             'tarde',     '{0,1,2,3,4,5,6}', 0),
    (uid, 'Sin pantallas 60 min antes de dormir', '📵',  'Luz azul → cortisol nocturno → sueño fragmentado.',                    'noche',     '{0,1,2,3,4,5,6}', 1),
    (uid, 'Sin comida 3h antes de dormir',        '🍽️',  'Mejora calidad de sueño y autofagia nocturna.',                        'noche',     '{0,1,2,3,4,5,6}', 2)
  on conflict (user_id, name) do update set
    emoji = excluded.emoji,
    description = excluded.description,
    time_of_day = excluded.time_of_day,
    days_of_week = excluded.days_of_week,
    "order" = excluded."order";

  raise notice 'Setup completo para el usuario %', uid;
end$$;
