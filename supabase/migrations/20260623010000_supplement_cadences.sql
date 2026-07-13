-- =====================================================
-- Cadencias: diario vs espaciado
--   - Quita Sea Moss del catálogo
--   - Bone Broth -> ayunas, fin de semana
--   - Asigna días de la semana a los suplementos no-diarios
--   (0=Dom 1=Lun 2=Mar 3=Mié 4=Jue 5=Vie 6=Sáb)
-- =====================================================
do $$
declare uid uuid;
begin
  select id into uid from auth.users order by created_at asc limit 1;
  if uid is null then return; end if;

  -- Quitar Sea Moss (schedules en cascada)
  delete from public.supplements where user_id = uid and name = 'Sea Moss';

  -- Bone Broth -> ayunas
  update public.supplement_schedules sc set time_of_day = 'ayunas'
    from public.supplements s
    where sc.supplement_id = s.id and s.user_id = uid and s.name = 'Bone Broth';

  -- Lun/Mié/Vie {1,3,5}
  update public.supplement_schedules sc set days_of_week = '{1,3,5}'
    from public.supplements s where sc.supplement_id = s.id and s.user_id = uid
    and s.name in ('Zinc','NAC','NAD+','Psyllium Husk');

  -- Lun-Vie {1,2,3,4,5} (descanso fin de semana)
  update public.supplement_schedules sc set days_of_week = '{1,2,3,4,5}'
    from public.supplements s where sc.supplement_id = s.id and s.user_id = uid
    and s.name = 'Adaptógenos';

  -- Mar/Jue/Sáb {2,4,6}
  update public.supplement_schedules sc set days_of_week = '{2,4,6}'
    from public.supplements s where sc.supplement_id = s.id and s.user_id = uid
    and s.name in ('Cúrcuma','Pimienta Negra','Jengibre','Ajo');

  -- Mar/Vie {2,5} (orégano: cursos cortos, recordatorio ligero)
  update public.supplement_schedules sc set days_of_week = '{2,5}'
    from public.supplements s where sc.supplement_id = s.id and s.user_id = uid
    and s.name = 'Aceite de Orégano';

  -- Sáb/Dom {0,6} (fin de semana)
  update public.supplement_schedules sc set days_of_week = '{0,6}'
    from public.supplements s where sc.supplement_id = s.id and s.user_id = uid
    and s.name in ('Enzimas digestivas','Bone Broth');

  -- El resto permanece diario {0,1,2,3,4,5,6}:
  --   Creatina, D3, K2, Omega-3, Tiamina B1, CoQ10, Berberina,
  --   Probiótico, Magnesio Glicinato, Glicina, Aceite de Oliva, Tés
end$$;
