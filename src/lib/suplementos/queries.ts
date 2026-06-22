"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  SupplementWithSchedules,
  StackWithItems,
  DailyChecklistItem,
  TimeOfDay,
} from "./types";
import { TIME_OF_DAY_ORDER } from "./types";

const supabase = createClient();

/** All supplements for the current user (active + inactive) */
export function useSupplements() {
  return useQuery({
    queryKey: ["suplementos", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplements")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

/** Active supplements with their schedules */
export function useActiveSupplements() {
  return useQuery({
    queryKey: ["suplementos", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplements")
        .select("*, supplement_schedules(*)")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data as SupplementWithSchedules[];
    },
  });
}

/** Schedules for a specific supplement */
export function useSupplementSchedules(supplementId: string | undefined) {
  return useQuery({
    queryKey: ["suplementos", "schedules", supplementId],
    enabled: !!supplementId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplement_schedules")
        .select("*")
        .eq("supplement_id", supplementId!);
      if (error) throw error;
      return data;
    },
  });
}

/** Today's logs for the current user */
export function useTodayLogs() {
  return useQuery({
    queryKey: ["suplementos", "todayLogs"],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("supplement_logs")
        .select("*")
        .gte("taken_at", todayStart.toISOString())
        .lte("taken_at", todayEnd.toISOString());
      if (error) throw error;
      return data;
    },
  });
}

/** Logs for a date range (for adherence calculations) */
export function useLogsInRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["suplementos", "logsRange", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplement_logs")
        .select("*")
        .gte("taken_at", startDate)
        .lte("taken_at", endDate);
      if (error) throw error;
      return data;
    },
  });
}

/** All stacks with their items and supplement details */
export function useStacks() {
  return useQuery({
    queryKey: ["suplementos", "stacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplement_stacks")
        .select("*, supplement_stack_items(*, supplement:supplements(*))")
        .order("name");
      if (error) throw error;
      return (data ?? []).map((stack) => ({
        ...stack,
        supplement_stack_items: (stack.supplement_stack_items ?? []).sort(
          (a: { order: number }, b: { order: number }) => a.order - b.order
        ),
      })) as StackWithItems[];
    },
  });
}

/** Build the daily checklist: supplements scheduled for today, grouped by time_of_day */
export function useDailyChecklist() {
  const { data: supplements, isLoading: supLoading } = useActiveSupplements();
  const { data: logs, isLoading: logsLoading } = useTodayLogs();

  const isLoading = supLoading || logsLoading;

  const { items, grouped, taken, total } = useMemo(() => {
    const list: DailyChecklistItem[] = [];
    const today = new Date().getDay(); // 0=Sunday

    if (supplements && logs) {
      for (const sup of supplements) {
        for (const sched of sup.supplement_schedules) {
          if (!sched.days_of_week.includes(today)) continue;
          const log =
            logs.find(
              (l) => l.supplement_id === sup.id && l.schedule_id === sched.id
            ) ?? null;
          list.push({ schedule: sched, supplement: sup, log });
        }
      }
    }

    // Sort by time_of_day order
    list.sort((a, b) => {
      const ai = TIME_OF_DAY_ORDER.indexOf(a.schedule.time_of_day);
      const bi = TIME_OF_DAY_ORDER.indexOf(b.schedule.time_of_day);
      return ai - bi;
    });

    // Group by time_of_day
    const grp = list.reduce(
      (acc, item) => {
        const key = item.schedule.time_of_day;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<TimeOfDay, DailyChecklistItem[]>
    );

    const tk = list.filter((i) => i.log && !i.log.skipped).length;
    return { items: list, grouped: grp, taken: tk, total: list.length };
  }, [supplements, logs]);

  return { items, grouped, taken, total, isLoading };
}

/** Weekly adherence: % of scheduled doses taken in the last 7 days */
export function useWeeklyAdherence() {
  // Stable date strings: recalculate only once per hour to avoid infinite re-fetch
  const hourBucket = Math.floor(Date.now() / 3_600_000);
  const [startStr, endStr] = useMemo(() => {
    const end = new Date();
    end.setMinutes(0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return [start.toISOString(), end.toISOString()] as const;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hourBucket]);

  const { data: supplements } = useActiveSupplements();
  const { data: logs } = useLogsInRange(startStr, endStr);

  if (!supplements || !logs) return null;

  // Count expected doses: for each supplement's schedule, count matching days
  let expected = 0;
  for (const sup of supplements) {
    for (const sched of sup.supplement_schedules) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(startStr);
        date.setDate(date.getDate() + d);
        if (sched.days_of_week.includes(date.getDay())) {
          expected++;
        }
      }
    }
  }

  const takenCount = logs.filter((l) => !l.skipped).length;
  return expected > 0 ? Math.round((takenCount / expected) * 100) : 100;
}
