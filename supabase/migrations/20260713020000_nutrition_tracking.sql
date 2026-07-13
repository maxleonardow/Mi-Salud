-- =====================================================
-- Nutrition tracking: personal meal and macro entries.
-- =====================================================

begin;

create table if not exists public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  meal_type text not null check (meal_type in ('desayuno', 'comida', 'cena', 'snack')),
  calories numeric(8,2) not null default 0 check (calories >= 0),
  protein_g numeric(8,2) not null default 0 check (protein_g >= 0),
  carbs_g numeric(8,2) not null default 0 check (carbs_g >= 0),
  fat_g numeric(8,2) not null default 0 check (fat_g >= 0),
  fiber_g numeric(8,2) not null default 0 check (fiber_g >= 0),
  notes text check (notes is null or char_length(notes) <= 500),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists food_entries_user_occurred
  on public.food_entries(user_id, occurred_at desc);

alter table public.food_entries enable row level security;

drop policy if exists food_entries_select_own on public.food_entries;
drop policy if exists food_entries_insert_own on public.food_entries;
drop policy if exists food_entries_update_own on public.food_entries;
drop policy if exists food_entries_delete_own on public.food_entries;

create policy food_entries_select_own on public.food_entries
  for select to authenticated using (auth.uid() = user_id);
create policy food_entries_insert_own on public.food_entries
  for insert to authenticated with check (auth.uid() = user_id);
create policy food_entries_update_own on public.food_entries
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy food_entries_delete_own on public.food_entries
  for delete to authenticated using (auth.uid() = user_id);

drop trigger if exists food_entries_set_updated_at on public.food_entries;
create trigger food_entries_set_updated_at before update on public.food_entries
  for each row execute function public.tg_set_updated_at();

notify pgrst, 'reload schema';

commit;
