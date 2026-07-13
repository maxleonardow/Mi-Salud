"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getDayRangeIso } from "@/lib/date";

const supabase = createClient();

export function useTodayFoodEntries() {
  return useQuery({
    queryKey: ["comer", "today"],
    queryFn: async () => {
      const [todayStart, tomorrowStart] = getDayRangeIso();
      const { data, error } = await supabase
        .from("food_entries")
        .select("*")
        .gte("occurred_at", todayStart)
        .lt("occurred_at", tomorrowStart)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useRecentFoodEntries(limit = 50) {
  return useQuery({
    queryKey: ["comer", "recent", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_entries")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}
