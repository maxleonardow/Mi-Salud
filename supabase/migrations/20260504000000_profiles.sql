-- profiles: per-user metadata, 1:1 with auth.users
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  birthdate date,
  units_pref text not null default 'metric' check (units_pref in ('metric','imperial')),
  timezone text not null default 'America/Mexico_City',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users can read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- bootstrap profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at auto-set
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();
