import type { Database } from "@/types/database.types";

export type FoodEntry = Database["public"]["Tables"]["food_entries"]["Row"];
export type FoodEntryInsert = Database["public"]["Tables"]["food_entries"]["Insert"];
export type FoodEntryUpdate = Database["public"]["Tables"]["food_entries"]["Update"];
export type MealType = FoodEntry["meal_type"];

export const MEAL_LABELS: Record<MealType, string> = {
  desayuno: "Desayuno",
  comida: "Comida",
  cena: "Cena",
  snack: "Snack",
};

export type NutritionSummary = {
  entries: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

export function summarizeNutrition(entries: FoodEntry[]): NutritionSummary {
  return entries.reduce<NutritionSummary>(
    (summary, entry) => ({
      entries: summary.entries + 1,
      calories: summary.calories + Number(entry.calories),
      proteinG: summary.proteinG + Number(entry.protein_g),
      carbsG: summary.carbsG + Number(entry.carbs_g),
      fatG: summary.fatG + Number(entry.fat_g),
      fiberG: summary.fiberG + Number(entry.fiber_g),
    }),
    { entries: 0, calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
  );
}
