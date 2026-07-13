import type { Database } from "@/types/database.types";

export type Habit = Database["public"]["Tables"]["habits"]["Row"];
export type HabitInsert = Database["public"]["Tables"]["habits"]["Insert"];
export type HabitUpdate = Database["public"]["Tables"]["habits"]["Update"];
export type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"];

export type HabitTimeOfDay = Habit["time_of_day"];

export type HabitWithLog = Habit & { log: HabitLog | null };

export const TIME_OF_DAY_LABELS: Record<HabitTimeOfDay, string> = {
  manana:    "Mañana",
  tarde:     "Tarde",
  noche:     "Noche",
  cualquier: "En cualquier momento",
};

export const TIME_OF_DAY_ORDER: HabitTimeOfDay[] = [
  "manana",
  "tarde",
  "noche",
  "cualquier",
];
