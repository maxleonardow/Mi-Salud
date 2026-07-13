import { z } from "zod";

const nutrient = z.coerce.number().min(0, "No puede ser negativo").max(10_000);

export const foodEntrySchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(120),
  meal_type: z.enum(["desayuno", "comida", "cena", "snack"]),
  calories: nutrient,
  protein_g: nutrient,
  carbs_g: nutrient,
  fat_g: nutrient,
  fiber_g: nutrient,
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type FoodEntryFormValues = z.infer<typeof foodEntrySchema>;
