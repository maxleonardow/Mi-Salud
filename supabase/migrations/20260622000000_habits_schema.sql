-- =====================================================
-- HABITS MODULE
-- =====================================================

create table public.habits (
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

create index habits_user_active on public.habits(user_id, active);

create table public.habit_logs (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  habit_id      uuid        not null references public.habits(id) on delete cascade,
  completed_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index habit_logs_user_date on public.habit_logs(user_id, completed_at);
create index habit_logs_habit    on public.habit_logs(habit_id);

-- RLS: deshabilitado a propósito para igualar al resto de la app.
-- Es una app personal local-first de un solo usuario; ninguna tabla usa RLS
-- (supplements, workouts, profiles, etc. corren con RLS off y sin sesión
-- autenticada). Activarlo solo aquí ocultaría los datos al usuario anónimo.
alter table public.habits     disable row level security;
alter table public.habit_logs disable row level security;

create trigger habits_set_updated_at before update on public.habits
  for each row execute function public.tg_set_updated_at();
