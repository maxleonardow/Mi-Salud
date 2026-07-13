"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { TIME_OF_DAY_ORDER, type HabitTimeOfDay, type HabitWithLog } from "./types";

const supabase = createClient();

export function useHabits() {
  return useQuery({
    queryKey: ["habitos", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .order("order")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useActiveHabits() {
  return useQuery({
    queryKey: ["habitos", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("active", true)
        .order("order")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useTodayHabitLogs() {
  return useQuery({
    queryKey: ["habitos", "todayLogs"],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const { data, error } = await supabase
        .from("habit_logs")
        .select("*")
        .gte("completed_at", todayStart.toISOString())
        .lte("completed_at", todayEnd.toISOString());
      if (error) throw error;
      return data;
    },
  });
}

export function useTodayHabits() {
  const { data: habits, isLoading: habitsLoading } = useActiveHabits();
  const { data: logs, isLoading: logsLoading } = useTodayHabitLogs();

  const isLoading = habitsLoading || logsLoading;

  const { items, grouped, done, total } = useMemo(() => {
    const today = new Date().getDay();
    const list: HabitWithLog[] = [];

    if (habits && logs) {
      for (const h of habits) {
        if (!h.days_of_week.includes(today)) continue;
        const log = logs.find((l) => l.habit_id === h.id) ?? null;
        list.push({ ...h, log });
      }
    }

    list.sort((a, b) => {
      const ai = TIME_OF_DAY_ORDER.indexOf(a.time_of_day);
      const bi = TIME_OF_DAY_ORDER.indexOf(b.time_of_day);
      if (ai !== bi) return ai - bi;
      return a.order - b.order;
    });

    const grp = list.reduce((acc, item) => {
      const key = item.time_of_day;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<HabitTimeOfDay, HabitWithLog[]>);

    const dk = list.filter((h) => h.log !== null).length;
    return { items: list, grouped: grp, done: dk, total: list.length };
  }, [habits, logs]);

  return { items, grouped, done, total, isLoading };
}
