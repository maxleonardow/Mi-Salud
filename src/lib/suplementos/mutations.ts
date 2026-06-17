"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { SupplementFormValues, StackFormValues } from "./schemas";

const supabase = createClient();

/** Create a new supplement with schedules */
export function useCreateSupplement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: SupplementFormValues) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");

      const { data: supplement, error } = await supabase
        .from("supplements")
        .insert({
          user_id: u.user.id,
          name: values.name,
          brand: values.brand || null,
          form: values.form,
          dose_amount: values.dose_amount,
          dose_unit: values.dose_unit,
          category: values.category,
          notes: values.notes || null,
        })
        .select()
        .single();
      if (error) throw error;

      // Insert schedules
      if (values.schedules.length > 0) {
        const { error: schedError } = await supabase
          .from("supplement_schedules")
          .insert(
            values.schedules.map((s) => ({
              supplement_id: supplement.id,
              user_id: u.user!.id,
              time_of_day: s.time_of_day,
              days_of_week: s.days_of_week,
              reminder: s.reminder,
            }))
          );
        if (schedError) throw schedError;
      }

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
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");

      const { data: supplement, error } = await supabase
        .from("supplements")
        .update({
          name: values.name,
          brand: values.brand || null,
          form: values.form,
          dose_amount: values.dose_amount,
          dose_unit: values.dose_unit,
          category: values.category,
          notes: values.notes || null,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // Replace schedules: delete old, insert new
      const { error: delSchedError } = await supabase
        .from("supplement_schedules")
        .delete()
        .eq("supplement_id", id);
      if (delSchedError) throw delSchedError;

      if (values.schedules.length > 0) {
        const { error: schedError } = await supabase
          .from("supplement_schedules")
          .insert(
            values.schedules.map((s) => ({
              supplement_id: id,
              user_id: u.user!.id,
              time_of_day: s.time_of_day,
              days_of_week: s.days_of_week,
              reminder: s.reminder,
            }))
          );
        if (schedError) throw schedError;
      }

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
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("supplement_logs")
        .insert({
          user_id: u.user.id,
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
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");

      const { data: stack, error } = await supabase
        .from("supplement_stacks")
        .insert({
          user_id: u.user.id,
          name: values.name,
          description: values.description || null,
        })
        .select()
        .single();
      if (error) throw error;

      if (values.supplement_ids.length > 0) {
        const { error: itemsError } = await supabase
          .from("supplement_stack_items")
          .insert(
            values.supplement_ids.map((sid, idx) => ({
              stack_id: stack.id,
              supplement_id: sid,
              order: idx,
            }))
          );
        if (itemsError) throw itemsError;
      }

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
      const { data: stack, error } = await supabase
        .from("supplement_stacks")
        .update({
          name: values.name,
          description: values.description || null,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // Replace items
      const { error: delItemsError } = await supabase
        .from("supplement_stack_items")
        .delete()
        .eq("stack_id", id);
      if (delItemsError) throw delItemsError;

      if (values.supplement_ids.length > 0) {
        const { error: itemsError } = await supabase
          .from("supplement_stack_items")
          .insert(
            values.supplement_ids.map((sid, idx) => ({
              stack_id: id,
              supplement_id: sid,
              order: idx,
            }))
          );
        if (itemsError) throw itemsError;
      }

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
