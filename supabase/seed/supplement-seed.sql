-- =====================================================
-- SUPPLEMENT SEED: common supplements for quick start
-- Run AFTER auth.users has at least one user.
-- Replace the user_id with your actual auth.uid().
-- =====================================================

-- Helper: get the first user (for local dev/seed)
do $$
declare
  uid uuid;
begin
  select id into uid from auth.users limit 1;
  if uid is null then
    raise notice 'No users found — skipping supplement seed.';
    return;
  end if;

  -- =====================================================
  -- 1. Supplements catalog
  -- =====================================================

  insert into public.supplements (user_id, name, brand, form, dose_amount, dose_unit, category, notes, active, is_seed) values
    (uid, 'Vitamina D3',   'Now Foods',     'softgel',  5000, 'IU',  'vitamina',   'Tomar con grasa para mejor absorción',        true, true),
    (uid, 'Omega-3',       'Nordic Naturals','softgel',  1000, 'mg',  'omega',      'EPA/DHA. Tomar con comida.',                   true, true),
    (uid, 'Magnesio Glicinato', 'Doctor''s Best', 'capsula', 400, 'mg', 'mineral', 'Ayuda con sueño y recuperación muscular',       true, true),
    (uid, 'Zinc Picolinato','Thorne',        'capsula',  30,   'mg',  'mineral',    'Immune support. No tomar con calcio.',          true, true),
    (uid, 'Creatina Monohidrato','Creapure', 'polvo',    5,    'g',   'aminoacido', 'Disuelta en agua. Todos los días.',             true, true),
    (uid, 'Ashwagandha KSM-66','Jarrow',    'capsula',  600,  'mg',  'herb',       'Adaptógeno. Reduce cortisol.',                  true, true),
    (uid, 'Vitamina K2 MK-7','Life Extension','softgel', 100,  'mcg', 'vitamina',   'Sinergia con D3. Tomar juntos.',                true, true),
    (uid, 'Probiótico',    'Seed',           'capsula',  1,    'g',   'probiotico', '24 cepas. Tomar en ayunas.',                    true, true),
    (uid, 'Vitamina C',    'NOW Foods',      'capsula',  1000, 'mg',  'vitamina',   'Ácido ascórbico.',                              true, true),
    (uid, 'Complejo B',    'Thorne',         'capsula',  1,    'g',   'vitamina',   'B-Complex. Energía y sistema nervioso.',         true, true);

  -- =====================================================
  -- 2. Schedules for seeded supplements
  -- =====================================================

  -- Vitamina D3: mañana
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week, reminder)
    select s.id, uid, 'manana', '{0,1,2,3,4,5,6}', false
    from public.supplements s where s.user_id = uid and s.name = 'Vitamina D3' and s.is_seed = true;

  -- Omega-3: con comida (lunch)
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week, reminder)
    select s.id, uid, 'con_comida', '{0,1,2,3,4,5,6}', false
    from public.supplements s where s.user_id = uid and s.name = 'Omega-3' and s.is_seed = true;

  -- Magnesio: noche
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week, reminder)
    select s.id, uid, 'antes_dormir', '{0,1,2,3,4,5,6}', false
    from public.supplements s where s.user_id = uid and s.name = 'Magnesio Glicinato' and s.is_seed = true;

  -- Zinc: noche
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week, reminder)
    select s.id, uid, 'noche', '{0,1,2,3,4,5,6}', false
    from public.supplements s where s.user_id = uid and s.name = 'Zinc Picolinato' and s.is_seed = true;

  -- Creatina: mañana
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week, reminder)
    select s.id, uid, 'manana', '{0,1,2,3,4,5,6}', false
    from public.supplements s where s.user_id = uid and s.name = 'Creatina Monohidrato' and s.is_seed = true;

  -- Ashwagandha: noche
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week, reminder)
    select s.id, uid, 'antes_dormir', '{0,1,2,3,4,5,6}', false
    from public.supplements s where s.user_id = uid and s.name = 'Ashwagandha KSM-66' and s.is_seed = true;

  -- K2: mañana (con D3)
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week, reminder)
    select s.id, uid, 'manana', '{0,1,2,3,4,5,6}', false
    from public.supplements s where s.user_id = uid and s.name = 'Vitamina K2 MK-7' and s.is_seed = true;

  -- Probiótico: mañana (ayunas)
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week, reminder)
    select s.id, uid, 'manana', '{0,1,2,3,4,5,6}', false
    from public.supplements s where s.user_id = uid and s.name = 'Probiótico' and s.is_seed = true;

  -- Vitamina C: mediodía
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week, reminder)
    select s.id, uid, 'mediodia', '{0,1,2,3,4,5,6}', false
    from public.supplements s where s.user_id = uid and s.name = 'Vitamina C' and s.is_seed = true;

  -- Complejo B: mañana
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week, reminder)
    select s.id, uid, 'manana', '{0,1,2,3,4,5,6}', false
    from public.supplements s where s.user_id = uid and s.name = 'Complejo B' and s.is_seed = true;

  -- =====================================================
  -- 3. Example stacks
  -- =====================================================

  -- Stack Mañana
  insert into public.supplement_stacks (user_id, name, description) values
    (uid, 'Stack Mañana', 'Suplementos del desayuno: D3+K2, Creatina, Probiótico, Complejo B');

  insert into public.supplement_stack_items (stack_id, supplement_id, "order")
    select st.id, s.id, row_number() over (order by s.name) - 1
    from public.supplement_stacks st
    cross join public.supplements s
    where st.user_id = uid and st.name = 'Stack Mañana'
      and s.user_id = uid and s.is_seed = true
      and s.name in ('Vitamina D3', 'Vitamina K2 MK-7', 'Creatina Monohidrato', 'Probiótico', 'Complejo B');

  -- Stack Noche
  insert into public.supplement_stacks (user_id, name, description) values
    (uid, 'Stack Noche', 'Relajación y recuperación: Magnesio, Ashwagandha, Zinc');

  insert into public.supplement_stack_items (stack_id, supplement_id, "order")
    select st.id, s.id, row_number() over (order by s.name) - 1
    from public.supplement_stacks st
    cross join public.supplements s
    where st.user_id = uid and st.name = 'Stack Noche'
      and s.user_id = uid and s.is_seed = true
      and s.name in ('Magnesio Glicinato', 'Ashwagandha KSM-66', 'Zinc Picolinato');

  raise notice 'Supplement seed complete for user %', uid;
end$$;
