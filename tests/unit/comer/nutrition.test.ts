import { describe, expect, it } from "vitest";
import { summarizeNutrition, type FoodEntry } from "@/lib/comer/types";

const entry = (values: Partial<FoodEntry>): FoodEntry => ({
  id: "entry-id",
  user_id: "user-id",
  name: "Comida",
  meal_type: "comida",
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fiber_g: 0,
  notes: null,
  occurred_at: "2026-07-13T18:00:00.000Z",
  created_at: "2026-07-13T18:00:00.000Z",
  updated_at: "2026-07-13T18:00:00.000Z",
  ...values,
});

describe("summarizeNutrition", () => {
  it("adds daily macros across entries", () => {
    const summary = summarizeNutrition([
      entry({ calories: 500, protein_g: 35, carbs_g: 50, fat_g: 15, fiber_g: 8 }),
      entry({ id: "entry-2", calories: 320, protein_g: 20, carbs_g: 30, fat_g: 10, fiber_g: 4 }),
    ]);

    expect(summary).toEqual({
      entries: 2,
      calories: 820,
      proteinG: 55,
      carbsG: 80,
      fatG: 25,
      fiberG: 12,
    });
  });

  it("returns zeroes for an empty day", () => {
    expect(summarizeNutrition([])).toEqual({
      entries: 0,
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
    });
  });
});
