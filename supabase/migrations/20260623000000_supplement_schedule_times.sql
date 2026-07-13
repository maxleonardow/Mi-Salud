-- =====================================================
-- Refine supplement_schedules time_of_day values
-- Old: manana | mediodia | tarde | noche | con_comida | antes_dormir
-- New: ayunas | desayuno | cena | noche | antes_dormir
-- (sin "con la comida" / mediodía — cada suplemento va a su mejor horario)
-- =====================================================

-- 1. Drop old check constraint
alter table public.supplement_schedules
  drop constraint if exists supplement_schedules_time_of_day_check;

-- 2. Migrate existing data
update public.supplement_schedules
  set time_of_day = 'ayunas'    where time_of_day = 'manana';
update public.supplement_schedules
  set time_of_day = 'desayuno'  where time_of_day = 'con_comida';
update public.supplement_schedules
  set time_of_day = 'cena'      where time_of_day in ('tarde','mediodia');

-- 3. Add new check constraint
alter table public.supplement_schedules
  add constraint supplement_schedules_time_of_day_check
  check (time_of_day in ('ayunas','desayuno','cena','noche','antes_dormir'));
