"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

const supabase = createClient();

type PlanScheduleRow = Database["public"]["Tables"]["plan_schedule_slots"]["Row"];
type TemplateExerciseRow = Database["public"]["Tables"]["workout_template_exercises"]["Row"];
type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];

export type PlanScheduleSlot = PlanScheduleRow & {
  template: Pick<
    Database["public"]["Tables"]["workout_templates"]["Row"],
    "id" | "name"
  > | null;
};

export type TemplateExercise = TemplateExerciseRow & {
  exercise: Pick<
    ExerciseRow,
    | "id"
    | "name"
    | "technique"
    | "substitute_ids"
    | "image_url"
    | "exercise_type"
    | "muscle_groups"
    | "equipment"
  > | null;
};

export type ExerciseSummary = Pick<
  ExerciseRow,
  "id" | "name" | "technique" | "image_url" | "muscle_groups" | "equipment"
>;

type ExerciseLibraryBase = Pick<
  ExerciseRow,
  | "id"
  | "name"
  | "technique"
  | "image_url"
  | "muscle_groups"
  | "equipment"
  | "exercise_type"
  | "substitute_ids"
>;

export type PlanExerciseLibraryItem = ExerciseLibraryBase & {
  template_names: string[];
  alternatives: ExerciseSummary[];
};

export function useActivePlan() {
  return useQuery({
    queryKey: ["mover", "activePlan"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function usePlanSchedule(planId: string | undefined) {
  return useQuery({
    queryKey: ["mover", "schedule", planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_schedule_slots")
        .select("*, template:workout_templates(id, name)")
        .eq("plan_id", planId!)
        .order("day_of_week");
      if (error) throw error;
      return data as PlanScheduleSlot[];
    },
  });
}

export function useTemplateExercises(templateId: string | undefined) {
  return useQuery({
    queryKey: ["mover", "templateExercises", templateId],
    enabled: !!templateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_template_exercises")
        .select("*, exercise:exercises(id, name, technique, substitute_ids, image_url, exercise_type, muscle_groups, equipment)")
        .eq("template_id", templateId!)
        .order("position");
      if (error) throw error;
      return data as TemplateExercise[];
    },
  });
}

export function useExercisesByIds(exerciseIds: string[]) {
  const stableIds = [...new Set(exerciseIds)].sort();

  return useQuery({
    queryKey: ["mover", "exercisesByIds", stableIds],
    enabled: stableIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, technique, image_url, muscle_groups, equipment")
        .in("id", stableIds);
      if (error) throw error;
      return data as ExerciseSummary[];
    },
  });
}

export function usePlanExerciseLibrary(planId: string | undefined) {
  return useQuery({
    queryKey: ["mover", "exerciseLibrary", planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data: templates, error: templatesError } = await supabase
        .from("workout_templates")
        .select("id, name, position")
        .eq("plan_id", planId!)
        .order("position");
      if (templatesError) throw templatesError;

      const templateIds = templates.map(template => template.id);
      if (templateIds.length === 0) return [] as PlanExerciseLibraryItem[];

      const { data: rows, error: rowsError } = await supabase
        .from("workout_template_exercises")
        .select("template_id, position, exercise:exercises(id, name, technique, image_url, muscle_groups, equipment, exercise_type, substitute_ids)")
        .in("template_id", templateIds)
        .order("position");
      if (rowsError) throw rowsError;

      const templateNames = new Map(templates.map(template => [template.id, template.name]));
      const exercises = new Map<string, ExerciseLibraryBase & { template_names: string[]; sort_order: number }>();

      rows.forEach((row, index) => {
        const exercise = row.exercise as ExerciseLibraryBase | null;
        if (!exercise) return;

        const templateName = templateNames.get(row.template_id);
        const existing = exercises.get(exercise.id);
        if (existing) {
          if (templateName && !existing.template_names.includes(templateName)) {
            existing.template_names.push(templateName);
          }
          return;
        }

        exercises.set(exercise.id, {
          ...exercise,
          template_names: templateName ? [templateName] : [],
          sort_order: index,
        });
      });

      const substituteIds = [...new Set(
        [...exercises.values()].flatMap(exercise => exercise.substitute_ids),
      )];
      const alternativesById = new Map<string, ExerciseSummary>();

      if (substituteIds.length > 0) {
        const { data: alternatives, error: alternativesError } = await supabase
          .from("exercises")
          .select("id, name, technique, image_url, muscle_groups, equipment")
          .in("id", substituteIds);
        if (alternativesError) throw alternativesError;
        alternatives.forEach(alternative => alternativesById.set(alternative.id, alternative));
      }

      return [...exercises.values()]
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "es"))
        .map(({ sort_order: _sortOrder, ...exercise }) => ({
          ...exercise,
          alternatives: exercise.substitute_ids
            .map(id => alternativesById.get(id))
            .filter((alternative): alternative is ExerciseSummary => alternative !== undefined),
        }));
    },
  });
}

export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["mover", "session", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("*, template:workout_templates(id, name)")
        .eq("id", sessionId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useSessionSetLogs(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["mover", "setLogs", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercise_set_logs")
        .select("*")
        .eq("session_id", sessionId!)
        .order("set_number");
      if (error) throw error;
      return data;
    },
  });
}

export function useRecentSessions(limit = 30) {
  return useQuery({
    queryKey: ["mover", "recentSessions", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("*, template:workout_templates(id, name)")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}

export function useExercisePriorMax(exerciseId: string | undefined) {
  return useQuery({
    queryKey: ["mover", "priorMax", exerciseId],
    enabled: !!exerciseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercise_set_logs")
        .select("weight_kg, reps")
        .eq("exercise_id", exerciseId!)
        .not("weight_kg", "is", null)
        .not("reps", "is", null);
      if (error) throw error;
      const maxE = data.reduce((max, s) => {
        const e = (s.weight_kg ?? 0) * (1 + (s.reps ?? 0) / 30);
        return e > max ? e : max;
      }, 0);
      return { max_e1rm: maxE };
    },
  });
}
