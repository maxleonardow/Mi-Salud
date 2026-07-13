"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { requireUserId } from "@/lib/supabase/auth";
import type { HabitInsert, HabitUpdate } from "./types";

const supabase = createClient();

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Omit<HabitInsert, "user_id">) => {
      const userId = await requireUserId(supabase);
      const { data, error } = await supabase
        .from("habits")
        .insert({ ...values, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habitos"] }),
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: HabitUpdate }) => {
      const { data, error } = await supabase
        .from("habits")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habitos"] }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("habits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habitos"] }),
  });
}

export function useToggleHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { data, error } = await supabase
        .from("habits")
        .update({ active })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habitos"] }),
  });
}

export function useLogHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (habitId: string) => {
      const userId = await requireUserId(supabase);
      const { data, error } = await supabase
        .from("habit_logs")
        .insert({ user_id: userId, habit_id: habitId, completed_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habitos", "todayLogs"] }),
  });
}

export function useUndoHabitLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase.from("habit_logs").delete().eq("id", logId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habitos", "todayLogs"] }),
  });
}
