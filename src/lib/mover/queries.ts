"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

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
      return data;
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
        .select("*, exercise:exercises(id, name, technique, substitute_ids, image_url, exercise_type, muscle_groups)")
        .eq("template_id", templateId!)
        .order("position");
      if (error) throw error;
      return data;
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
