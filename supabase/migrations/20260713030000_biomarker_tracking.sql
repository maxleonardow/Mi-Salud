-- =====================================================
-- Biomarker tracking: values and report-provided ranges.
-- =====================================================

begin;

create table if not exists public.biomarker_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  marker_name text not null check (char_length(marker_name) between 1 and 120),
  value numeric(14,4) not null,
  unit text not null check (char_length(unit) between 1 and 40),
  reference_min numeric(14,4),
  reference_max numeric(14,4),
  measured_at date not null default current_date,
  laboratory text check (laboratory is null or char_length(laboratory) <= 120),
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reference_min is null or reference_max is null or reference_min <= reference_max)
);

create index if not exists biomarker_results_user_marker_date
  on public.biomarker_results(user_id, marker_name, measured_at desc);

alter table public.biomarker_results enable row level security;

drop policy if exists biomarker_results_select_own on public.biomarker_results;
drop policy if exists biomarker_results_insert_own on public.biomarker_results;
drop policy if exists biomarker_results_update_own on public.biomarker_results;
drop policy if exists biomarker_results_delete_own on public.biomarker_results;

create policy biomarker_results_select_own on public.biomarker_results
  for select to authenticated using (auth.uid() = user_id);
create policy biomarker_results_insert_own on public.biomarker_results
  for insert to authenticated with check (auth.uid() = user_id);
create policy biomarker_results_update_own on public.biomarker_results
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy biomarker_results_delete_own on public.biomarker_results
  for delete to authenticated using (auth.uid() = user_id);

drop trigger if exists biomarker_results_set_updated_at on public.biomarker_results;
create trigger biomarker_results_set_updated_at before update on public.biomarker_results
  for each row execute function public.tg_set_updated_at();

notify pgrst, 'reload schema';

commit;
