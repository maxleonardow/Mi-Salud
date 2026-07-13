"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { AccountSettings } from "./types";

const supabase = createClient();

export function useAccountSettings() {
  return useQuery({
    queryKey: ["ajustes", "account"],
    queryFn: async (): Promise<AccountSettings> => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Not authenticated");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (profileError) throw profileError;

      return {
        userId: userData.user.id,
        email: userData.user.email ?? null,
        profile,
      };
    },
  });
}
