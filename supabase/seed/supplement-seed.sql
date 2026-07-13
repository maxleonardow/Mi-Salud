-- =====================================================
-- SUPPLEMENT SEED: tu stack personalizado (25 ítems)
-- One-time seed. Prefer apply-all.sql for repeatable, non-destructive updates.
-- Run AFTER auth.users has at least one user.
-- =====================================================

do $$
declare uid uuid;
begin
  select id into uid from auth.users limit 1;
  if uid is null then
    raise notice 'No users found — skipping supplement seed.';
    return;
  end if;

  if exists (select 1 from public.supplements where user_id = uid and is_seed) then
    raise notice 'Supplement seed already exists for user % — skipping.', uid;
    return;
  end if;

  -- =====================================================
  -- 1. Catálogo
  -- =====================================================
  insert into public.supplements (user_id, name, form, dose_amount, dose_unit, category, notes, active, is_seed) values
    -- Suplementos core
    (uid, 'Creatina',           'polvo',   5,    'g',   'aminoacido', 'Monohidrato. Disuelta en agua. Todos los días.',                      true, true),
    (uid, 'Vitamina D3',        'softgel', 6000, 'IU',  'vitamina',   'Con grasa para mejor absorción. Junto con K2.',                       true, true),
    (uid, 'Vitamina K2 MK-7',   'softgel', 100,  'mcg', 'vitamina',   'Sinergia con D3. Tomar juntos.',                                      true, true),
    (uid, 'Omega-3',            'softgel', 2000, 'mg',  'omega',      'EPA/DHA. Con comida.',                                                true, true),
    (uid, 'Magnesio Glicinato', 'capsula', 400,  'mg',  'mineral',    'Antes de dormir. Sueño, cortisol, energía.',                          true, true),
    (uid, 'Berberina',          'capsula', 500,  'mg',  'herb',       'Con comida. Glucosa, gut, antimicrobiano.',                           true, true),
    (uid, 'NAD+',               'capsula', 250,  'mg',  'otro',       'Mañana. Energía celular, reparación de DNA.',                         true, true),
    (uid, 'Sea Moss',           'capsula', 1,    'g',   'otro',       'Minerales, tiroides. Mañana.',                                        true, true),
    (uid, 'Adaptógenos',        'capsula', 600,  'mg',  'herb',       'Ashwagandha KSM-66 o Rhodiola. Mañana o noche.',                      true, true),
    (uid, 'Enzimas digestivas', 'capsula', 1,    'g',   'otro',       'Con cada comida principal.',                                          true, true),
    (uid, 'Probiótico',         'capsula', 1,    'g',   'probiotico', 'Mañana en ayunas.',                                                   true, true),
    -- Para agregar (pendientes)
    (uid, 'Glicina',            'polvo',   5,    'g',   'aminoacido', 'Antes de dormir. Sueño profundo. Con NAC = GlyNAC.',                  true, true),
    (uid, 'NAC',                'capsula', 600,  'mg',  'aminoacido', 'Mañana. Con glicina = GlyNAC (mejor evidencia anti-aging humana).',   true, true),
    (uid, 'Zinc',               'capsula', 15,   'mg',  'mineral',    'Noche. Libido, testosterona, recuperación. No con magnesio.',         true, true),
    (uid, 'Tiamina B1',         'capsula', 100,  'mg',  'vitamina',   'Mañana. Energía celular, nervios. Tier S.',                           true, true),
    (uid, 'Psyllium Husk',      'polvo',   5,    'g',   'otro',       'Con vaso grande de agua antes de comida. Microbioma, glucosa.',       true, true),
    (uid, 'CoQ10',              'softgel', 200,  'mg',  'otro',       'Con comida grasa. Mitocondrias, energía celular.',                    true, true),
    -- Alimentos funcionales / hierbas
    (uid, 'Cúrcuma',            'capsula', 500,  'mg',  'herb',       'Siempre con pimienta negra. Con comida.',                             true, true),
    (uid, 'Pimienta Negra',     'capsula', 5,    'mg',  'herb',       'Junto a cúrcuma. Multiplica biodisponibilidad 20x.',                  true, true),
    (uid, 'Aceite de Orégano',  'liquido', 500,  'mg',  'herb',       'Antimicrobiano gut. Con comida.',                                     true, true),
    (uid, 'Bone Broth',         'liquido', 240,  'ml',  'otro',       'Colágeno, gut healing, glicina natural.',                             true, true),
    (uid, 'Aceite de Oliva',    'liquido', 15,   'ml',  'otro',       'Extra virgen. Con comida. Polifenoles, anti-inflamatorio.',            true, true),
    (uid, 'Jengibre',           'capsula', 500,  'mg',  'herb',       'Anti-inflamatorio, digestión, testosterona natural.',                 true, true),
    (uid, 'Ajo',                'capsula', 600,  'mg',  'herb',       'Cardiovascular, antimicrobiano. Con comida.',                         true, true),
    (uid, 'Tés',                'liquido', 240,  'ml',  'otro',       'Verde, matcha, rooibos. Polifenoles, L-teanina natural.',             true, true);

  -- =====================================================
  -- 2. Schedules
  -- =====================================================

  -- En ayunas (estómago vacío, separado del resto)
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week)
    select s.id, uid, 'ayunas', '{0,1,2,3,4,5,6}'
    from public.supplements s
    where s.user_id = uid and s.is_seed = true
      and s.name in ('Probiótico','Tés','Psyllium Husk');

  -- Con el desayuno
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week)
    select s.id, uid, 'desayuno', '{0,1,2,3,4,5,6}'
    from public.supplements s
    where s.user_id = uid and s.is_seed = true
      and s.name in ('Creatina','Vitamina D3','Vitamina K2 MK-7','Omega-3','NAD+','Sea Moss','NAC','Tiamina B1','Adaptógenos','Jengibre','Berberina','CoQ10');

  -- Con la cena
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week)
    select s.id, uid, 'cena', '{0,1,2,3,4,5,6}'
    from public.supplements s
    where s.user_id = uid and s.is_seed = true
      and s.name in ('Aceite de Orégano','Bone Broth','Aceite de Oliva','Ajo','Cúrcuma','Pimienta Negra','Enzimas digestivas');

  -- Noche (zinc separado del magnesio)
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week)
    select s.id, uid, 'noche', '{0,1,2,3,4,5,6}'
    from public.supplements s
    where s.user_id = uid and s.is_seed = true
      and s.name in ('Zinc');

  -- Antes de dormir
  insert into public.supplement_schedules (supplement_id, user_id, time_of_day, days_of_week)
    select s.id, uid, 'antes_dormir', '{0,1,2,3,4,5,6}'
    from public.supplements s
    where s.user_id = uid and s.is_seed = true
      and s.name in ('Magnesio Glicinato','Glicina');

  -- =====================================================
  -- 3. Stacks
  -- =====================================================

  insert into public.supplement_stacks (user_id, name, description) values
    (uid, 'Stack Ayunas',       'Probiótico, Psyllium, Tés — estómago vacío, separado del resto'),
    (uid, 'Stack Desayuno',     'D3+K2, Creatina, Omega-3, NAD+, Tiamina, NAC, Sea Moss, Jengibre, Adaptógenos, Berberina, CoQ10'),
    (uid, 'Stack Cena',         'Cúrcuma+Pimienta, Enzimas, Aceite de Oliva, Bone Broth, Ajo, Aceite de Orégano'),
    (uid, 'Stack Dormir',       'Magnesio Glicinato, Glicina, Zinc');

  insert into public.supplement_stack_items (stack_id, supplement_id, "order")
    select st.id, s.id, row_number() over (order by s.name) - 1
    from public.supplement_stacks st
    cross join public.supplements s
    where st.user_id = uid and st.name = 'Stack Ayunas'
      and s.user_id = uid and s.is_seed = true
      and s.name in ('Probiótico','Psyllium Husk','Tés');

  insert into public.supplement_stack_items (stack_id, supplement_id, "order")
    select st.id, s.id, row_number() over (order by s.name) - 1
    from public.supplement_stacks st
    cross join public.supplements s
    where st.user_id = uid and st.name = 'Stack Desayuno'
      and s.user_id = uid and s.is_seed = true
      and s.name in ('Creatina','Vitamina D3','Vitamina K2 MK-7','Omega-3','NAD+','Sea Moss','NAC','Tiamina B1','Adaptógenos','Jengibre','Berberina','CoQ10');

  insert into public.supplement_stack_items (stack_id, supplement_id, "order")
    select st.id, s.id, row_number() over (order by s.name) - 1
    from public.supplement_stacks st
    cross join public.supplements s
    where st.user_id = uid and st.name = 'Stack Cena'
      and s.user_id = uid and s.is_seed = true
      and s.name in ('Cúrcuma','Pimienta Negra','Enzimas digestivas','Aceite de Oliva','Bone Broth','Ajo','Aceite de Orégano');

  insert into public.supplement_stack_items (stack_id, supplement_id, "order")
    select st.id, s.id, row_number() over (order by s.name) - 1
    from public.supplement_stacks st
    cross join public.supplements s
    where st.user_id = uid and st.name = 'Stack Dormir'
      and s.user_id = uid and s.is_seed = true
      and s.name in ('Magnesio Glicinato','Glicina','Zinc');

  raise notice 'Supplement seed complete for user %', uid;
end$$;
