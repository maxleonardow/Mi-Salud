"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { requireUserId } from "@/lib/supabase/auth";
import type { FoodEntryFormValues } from "./schemas";

const supabase = createClient();

function toRow(values: FoodEntryFormValues) {
  return {
    ...values,
    notes: values.notes || null,
  };
}

export function useCreateFoodEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: FoodEntryFormValues) => {
      const userId = await requireUserId(supabase);
      const { data, error } = await supabase
        .from("food_entries")
        .insert({ ...toRow(values), user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comer"] }),
  });
}

export function useUpdateFoodEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: FoodEntryFormValues }) => {
      const { data, error } = await supabase
        .from("food_entries")
        .update(toRow(values))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comer"] }),
  });
}

export function useDeleteFoodEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("food_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comer"] }),
  });
}
