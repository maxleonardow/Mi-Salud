"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export function useBiomarkerResults(limit = 200) {
  return useQuery({
    queryKey: ["labs", "results", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("biomarker_results")
        .select("*")
        .order("measured_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}
