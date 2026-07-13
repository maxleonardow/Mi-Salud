"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { requireUserId } from "@/lib/supabase/auth";
import { APP_TIME_ZONE } from "@/lib/date";
import type { UnitsPreference } from "./types";

const supabase = createClient();

export type ProfileSettingsValues = {
  displayName: string;
  birthdate: string;
  unitsPreference: UnitsPreference;
};

export function useSaveProfileSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: ProfileSettingsValues) => {
      const userId = await requireUserId(supabase);
      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          user_id: userId,
          display_name: values.displayName.trim() || null,
          birthdate: values.birthdate || null,
          units_pref: values.unitsPreference,
          timezone: APP_TIME_ZONE,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ajustes"] }),
  });
}
