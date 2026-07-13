-- =====================================================
-- Atomic supplement and stack catalog writes.
-- Each RPC runs as the authenticated caller and obeys RLS.
-- =====================================================

begin;

create unique index if not exists supplement_schedules_slot_unique
  on public.supplement_schedules(supplement_id, time_of_day);

create or replace function public.save_supplement(
  p_id uuid,
  p_name text,
  p_brand text,
  p_form text,
  p_dose_amount numeric,
  p_dose_unit text,
  p_category text,
  p_notes text,
  p_schedules jsonb
)
returns public.supplements
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_supplement public.supplements;
  v_schedule jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_id is null then
    insert into public.supplements (
      user_id, name, brand, form, dose_amount, dose_unit, category, notes
    ) values (
      v_user_id, p_name, nullif(p_brand, ''), p_form, p_dose_amount,
      p_dose_unit, p_category, nullif(p_notes, '')
    ) returning * into v_supplement;
  else
    update public.supplements
    set name = p_name,
        brand = nullif(p_brand, ''),
        form = p_form,
        dose_amount = p_dose_amount,
        dose_unit = p_dose_unit,
        category = p_category,
        notes = nullif(p_notes, '')
    where id = p_id and user_id = v_user_id
    returning * into v_supplement;

    if not found then
      raise exception 'Supplement not found' using errcode = 'P0002';
    end if;

  end if;

  for v_schedule in
    select value from jsonb_array_elements(coalesce(p_schedules, '[]'::jsonb))
  loop
    insert into public.supplement_schedules (
      supplement_id, user_id, time_of_day, days_of_week, reminder
    ) values (
      v_supplement.id,
      v_user_id,
      v_schedule ->> 'time_of_day',
      array(
        select value::int
        from jsonb_array_elements_text(v_schedule -> 'days_of_week')
      ),
      coalesce((v_schedule ->> 'reminder')::boolean, false)
    )
    on conflict (supplement_id, time_of_day) do update set
      days_of_week = excluded.days_of_week,
      reminder = excluded.reminder,
      user_id = excluded.user_id;
  end loop;

  delete from public.supplement_schedules existing
  where existing.supplement_id = v_supplement.id
    and existing.user_id = v_user_id
    and not exists (
      select 1
      from jsonb_array_elements(coalesce(p_schedules, '[]'::jsonb)) requested
      where requested ->> 'time_of_day' = existing.time_of_day
    );

  return v_supplement;
end;
$$;

create or replace function public.save_supplement_stack(
  p_id uuid,
  p_name text,
  p_description text,
  p_supplement_ids uuid[]
)
returns public.supplement_stacks
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_stack public.supplement_stacks;
  v_expected int := coalesce(cardinality(p_supplement_ids), 0);
  v_inserted int;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_id is null then
    insert into public.supplement_stacks (user_id, name, description)
    values (v_user_id, p_name, nullif(p_description, ''))
    returning * into v_stack;
  else
    update public.supplement_stacks
    set name = p_name, description = nullif(p_description, '')
    where id = p_id and user_id = v_user_id
    returning * into v_stack;

    if not found then
      raise exception 'Supplement stack not found' using errcode = 'P0002';
    end if;

    delete from public.supplement_stack_items where stack_id = p_id;
  end if;

  insert into public.supplement_stack_items (stack_id, supplement_id, "order")
  select v_stack.id, requested.supplement_id, requested.position - 1
  from unnest(coalesce(p_supplement_ids, '{}'::uuid[]))
    with ordinality as requested(supplement_id, position)
  join public.supplements owned
    on owned.id = requested.supplement_id and owned.user_id = v_user_id;

  get diagnostics v_inserted = row_count;
  if v_inserted <> v_expected then
    raise exception 'One or more supplements are not available to this user'
      using errcode = '42501';
  end if;

  return v_stack;
end;
$$;

revoke all on function public.save_supplement(uuid, text, text, text, numeric, text, text, text, jsonb) from public;
revoke all on function public.save_supplement_stack(uuid, text, text, uuid[]) from public;
grant execute on function public.save_supplement(uuid, text, text, text, numeric, text, text, text, jsonb) to authenticated;
grant execute on function public.save_supplement_stack(uuid, text, text, uuid[]) to authenticated;

notify pgrst, 'reload schema';

commit;
