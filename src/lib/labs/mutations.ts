"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { requireUserId } from "@/lib/supabase/auth";
import type { BiomarkerResultFormValues } from "./schemas";

const supabase = createClient();

function toRow(values: BiomarkerResultFormValues) {
  return {
    ...values,
    laboratory: values.laboratory || null,
    notes: values.notes || null,
  };
}

export function useCreateBiomarkerResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: BiomarkerResultFormValues) => {
      const userId = await requireUserId(supabase);
      const { data, error } = await supabase
        .from("biomarker_results")
        .insert({ ...toRow(values), user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["labs"] }),
  });
}

export function useUpdateBiomarkerResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: BiomarkerResultFormValues }) => {
      const { data, error } = await supabase
        .from("biomarker_results")
        .update(toRow(values))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["labs"] }),
  });
}

export function useDeleteBiomarkerResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("biomarker_results").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["labs"] }),
  });
}
