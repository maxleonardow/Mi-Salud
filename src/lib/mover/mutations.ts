"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { requireUserId } from "@/lib/supabase/auth";
import { isPr } from "./compute-pr";

const supabase = createClient();

export function useInstallDefaultWorkoutPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("install_default_workout_plan");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mover"] });
    },
  });
}

export function useStartSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { templateId: string | null; date?: string }) => {
      const userId = await requireUserId(supabase);
      const { data, error } = await supabase
        .from("workout_sessions")
        .insert({
          user_id: userId,
          template_id: params.templateId,
          date: params.date ?? new Date().toISOString().slice(0, 10),
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mover", "recentSessions"] });
    },
  });
}

export function useLogSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      sessionId: string;
      exerciseId: string;
      setNumber: number;
      reps: number | null;
      weightKg: number | null;
      durationSec?: number | null;
      rpe?: number | null;
      notes?: string | null;
    }) => {
      const userId = await requireUserId(supabase);
      const { data: priorRows } = await supabase
        .from("exercise_set_logs")
        .select("weight_kg, reps")
        .eq("exercise_id", params.exerciseId)
        .not("weight_kg", "is", null)
        .not("reps", "is", null);
      const priorMax = (priorRows ?? []).reduce((max, s) => {
        const e = (s.weight_kg ?? 0) * (1 + (s.reps ?? 0) / 30);
        return e > max ? e : max;
      }, 0);
      const pr = isPr(
        { weight_kg: params.weightKg, reps: params.reps },
        priorMax > 0 ? { max_e1rm: priorMax } : null
      );

      const { data, error } = await supabase
        .from("exercise_set_logs")
        .insert({
          user_id: userId,
          session_id: params.sessionId,
          exercise_id: params.exerciseId,
          set_number: params.setNumber,
          reps: params.reps,
          weight_kg: params.weightKg,
          duration_sec: params.durationSec ?? null,
          rpe: params.rpe ?? null,
          notes: params.notes ?? null,
          is_pr: pr,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["mover", "setLogs", vars.sessionId] });
      qc.invalidateQueries({ queryKey: ["mover", "priorMax", vars.exerciseId] });
    },
  });
}

export function useCompleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      sessionId: string;
      overallRpe?: number | null;
      notes?: string | null;
    }) => {
      const endedAt = new Date();
      const { data: session } = await supabase
        .from("workout_sessions")
        .select("started_at")
        .eq("id", params.sessionId)
        .single();
      const startedAt = session?.started_at ? new Date(session.started_at) : endedAt;
      const durationMin = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));

      const { data, error } = await supabase
        .from("workout_sessions")
        .update({
          status: "completed",
          ended_at: endedAt.toISOString(),
          duration_min: durationMin,
          overall_rpe: params.overallRpe ?? null,
          notes: params.notes ?? null,
        })
        .eq("id", params.sessionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mover", "recentSessions"] });
    },
  });
}

export function useDeleteSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { setId: string; sessionId: string }) => {
      const { error } = await supabase.from("exercise_set_logs").delete().eq("id", params.setId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["mover", "setLogs", vars.sessionId] });
    },
  });
}
