"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { requireUserId } from "@/lib/supabase/auth";
import type { SupplementFormValues, StackFormValues } from "./schemas";

const supabase = createClient();

/** Create a new supplement with schedules */
export function useCreateSupplement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: SupplementFormValues) => {
      const { data: supplement, error } = await supabase.rpc("save_supplement", {
        p_id: null,
        p_name: values.name,
        p_brand: values.brand || null,
        p_form: values.form,
        p_dose_amount: values.dose_amount,
        p_dose_unit: values.dose_unit,
        p_category: values.category,
        p_notes: values.notes || null,
        p_schedules: values.schedules,
      });
      if (error) throw error;
      return supplement;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suplementos"] });
    },
  });
}

/** Update an existing supplement and its schedules */
export function useUpdateSupplement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: SupplementFormValues;
    }) => {
      const { data: supplement, error } = await supabase.rpc("save_supplement", {
        p_id: id,
        p_name: values.name,
        p_brand: values.brand || null,
        p_form: values.form,
        p_dose_amount: values.dose_amount,
        p_dose_unit: values.dose_unit,
        p_category: values.category,
        p_notes: values.notes || null,
        p_schedules: values.schedules,
      });
      if (error) throw error;
      return supplement;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suplementos"] });
    },
  });
}

/** Toggle supplement active/inactive */
export function useToggleSupplement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { data, error } = await supabase
        .from("supplements")
        .update({ active })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suplementos"] });
    },
  });
}

/** Delete a supplement */
export function useDeleteSupplement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("supplements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suplementos"] });
    },
  });
}

/** Log a supplement as taken (optimistic-ready) */
export function useLogSupplement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      supplementId,
      scheduleId,
      skipped = false,
      notes,
    }: {
      supplementId: string;
      scheduleId: string;
      skipped?: boolean;
      notes?: string;
    }) => {
      const userId = await requireUserId(supabase);

      const { data, error } = await supabase
        .from("supplement_logs")
        .insert({
          user_id: userId,
          supplement_id: supplementId,
          schedule_id: scheduleId,
          taken_at: new Date().toISOString(),
          skipped,
          notes: notes || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suplementos", "todayLogs"] });
    },
  });
}

/** Remove a log entry (undo) */
export function useUndoLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from("supplement_logs")
        .delete()
        .eq("id", logId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suplementos", "todayLogs"] });
    },
  });
}

/** Create a stack */
export function useCreateStack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: StackFormValues) => {
      const { data: stack, error } = await supabase.rpc("save_supplement_stack", {
        p_id: null,
        p_name: values.name,
        p_description: values.description || null,
        p_supplement_ids: values.supplement_ids,
      });
      if (error) throw error;
      return stack;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suplementos", "stacks"] });
    },
  });
}

/** Update a stack */
export function useUpdateStack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: StackFormValues }) => {
      const { data: stack, error } = await supabase.rpc("save_supplement_stack", {
        p_id: id,
        p_name: values.name,
        p_description: values.description || null,
        p_supplement_ids: values.supplement_ids,
      });
      if (error) throw error;
      return stack;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suplementos", "stacks"] });
    },
  });
}

/** Delete a stack */
export function useDeleteStack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("supplement_stacks")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suplementos", "stacks"] });
    },
  });
}
