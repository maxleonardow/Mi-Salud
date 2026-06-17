-- =====================================================
-- SUPPLEMENTS MODULE: 5 tables for supplement tracking
-- =====================================================

-- Catalog: user supplements
create table public.supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  brand text,
  form text not null check (form in ('capsula','tableta','polvo','liquido','softgel')),
  dose_amount numeric not null,
  dose_unit text not null check (dose_unit in ('mg','g','mcg','IU','ml')),
  category text not null check (category in ('vitamina','mineral','aminoacido','herb','probiotico','omega','otro')),
  notes text,
  active boolean not null default true,
  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index supplements_user_active on public.supplements(user_id, active);

-- Schedules: when to take each supplement
create table public.supplement_schedules (
  id uuid primary key default gen_random_uuid(),
  supplement_id uuid not null references public.supplements(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  time_of_day text not null check (time_of_day in ('manana','mediodia','tarde','noche','con_comida','antes_dormir')),
  days_of_week int[] not null default '{0,1,2,3,4,5,6}',
  reminder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index supplement_schedules_supplement on public.supplement_schedules(supplement_id);
create index supplement_schedules_user on public.supplement_schedules(user_id);

-- Logs: daily intake records
create table public.supplement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  supplement_id uuid not null references public.supplements(id) on delete cascade,
  schedule_id uuid references public.supplement_schedules(id) on delete set null,
  taken_at timestamptz not null default now(),
  skipped boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create index supplement_logs_user_date on public.supplement_logs(user_id, taken_at);
create index supplement_logs_supplement on public.supplement_logs(supplement_id);

-- Stacks: grouped supplements
create table public.supplement_stacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Stack items: supplements in a stack
create table public.supplement_stack_items (
  id uuid primary key default gen_random_uuid(),
  stack_id uuid not null references public.supplement_stacks(id) on delete cascade,
  supplement_id uuid not null references public.supplements(id) on delete cascade,
  "order" int not null default 0,
  created_at timestamptz not null default now(),
  unique (stack_id, supplement_id)
);

create index supplement_stack_items_stack on public.supplement_stack_items(stack_id);

-- =====================================================
-- RLS: enable + policies (user_id = auth.uid())
-- =====================================================

alter table public.supplements             enable row level security;
alter table public.supplement_schedules    enable row level security;
alter table public.supplement_logs         enable row level security;
alter table public.supplement_stacks       enable row level security;
alter table public.supplement_stack_items  enable row level security;

-- User-scoped tables: standard CRUD policies
do $$
declare t text;
begin
  for t in
    select unnest(array[
      'supplements','supplement_schedules','supplement_logs','supplement_stacks'
    ])
  loop
    execute format('create policy "%1$s_select_own" on public.%1$s for select using (auth.uid() = user_id)', t);
    execute format('create policy "%1$s_insert_own" on public.%1$s for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "%1$s_update_own" on public.%1$s for update using (auth.uid() = user_id)', t);
    execute format('create policy "%1$s_delete_own" on public.%1$s for delete using (auth.uid() = user_id)', t);
  end loop;
end$$;

-- Stack items: access via stack ownership
create policy "supplement_stack_items_select_own" on public.supplement_stack_items
  for select using (
    exists (select 1 from public.supplement_stacks where id = stack_id and user_id = auth.uid())
  );
create policy "supplement_stack_items_insert_own" on public.supplement_stack_items
  for insert with check (
    exists (select 1 from public.supplement_stacks where id = stack_id and user_id = auth.uid())
  );
create policy "supplement_stack_items_update_own" on public.supplement_stack_items
  for update using (
    exists (select 1 from public.supplement_stacks where id = stack_id and user_id = auth.uid())
  );
create policy "supplement_stack_items_delete_own" on public.supplement_stack_items
  for delete using (
    exists (select 1 from public.supplement_stacks where id = stack_id and user_id = auth.uid())
  );

-- =====================================================
-- Triggers: updated_at on catalogs
-- =====================================================

create trigger supplements_set_updated_at            before update on public.supplements            for each row execute function public.tg_set_updated_at();
create trigger supplement_schedules_set_updated_at   before update on public.supplement_schedules   for each row execute function public.tg_set_updated_at();
create trigger supplement_stacks_set_updated_at      before update on public.supplement_stacks      for each row execute function public.tg_set_updated_at();
