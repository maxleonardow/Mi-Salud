-- =====================================================
-- Explicit SQL privileges for the authenticated app role.
-- RLS still limits every operation to rows owned by auth.uid().
-- =====================================================

begin;

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on table
  public.profiles,
  public.exercises,
  public.workout_plans,
  public.workout_templates,
  public.workout_template_exercises,
  public.plan_schedule_slots,
  public.workout_sessions,
  public.exercise_set_logs,
  public.daily_tips,
  public.daily_tip_logs,
  public.supplements,
  public.supplement_schedules,
  public.supplement_logs,
  public.supplement_stacks,
  public.supplement_stack_items,
  public.habits,
  public.habit_logs,
  public.food_entries,
  public.biomarker_results
to authenticated;

grant all privileges on table
  public.profiles,
  public.exercises,
  public.workout_plans,
  public.workout_templates,
  public.workout_template_exercises,
  public.plan_schedule_slots,
  public.workout_sessions,
  public.exercise_set_logs,
  public.daily_tips,
  public.daily_tip_logs,
  public.supplements,
  public.supplement_schedules,
  public.supplement_logs,
  public.supplement_stacks,
  public.supplement_stack_items,
  public.habits,
  public.habit_logs,
  public.food_entries,
  public.biomarker_results
to service_role;

-- The application has no anonymous data surface. Removing direct table
-- privileges makes that boundary explicit even if a policy changes later.
revoke all privileges on table
  public.profiles,
  public.exercises,
  public.workout_plans,
  public.workout_templates,
  public.workout_template_exercises,
  public.plan_schedule_slots,
  public.workout_sessions,
  public.exercise_set_logs,
  public.daily_tips,
  public.daily_tip_logs,
  public.supplements,
  public.supplement_schedules,
  public.supplement_logs,
  public.supplement_stacks,
  public.supplement_stack_items,
  public.habits,
  public.habit_logs,
  public.food_entries,
  public.biomarker_results
from anon;

notify pgrst, 'reload schema';

commit;
