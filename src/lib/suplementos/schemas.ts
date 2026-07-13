import { z } from "zod";

export const supplementFormSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100),
  brand: z.string().max(100).optional().or(z.literal("")),
  form: z.enum(["capsula", "tableta", "polvo", "liquido", "softgel"]),
  dose_amount: z.coerce.number().positive("La dosis debe ser mayor a 0"),
  dose_unit: z.enum(["mg", "g", "mcg", "IU", "ml"]),
  category: z.enum(["vitamina", "mineral", "aminoacido", "herb", "probiotico", "omega", "otro"]),
  notes: z.string().max(500).optional().or(z.literal("")),
  schedules: z
    .array(
      z.object({
        time_of_day: z.enum([
          "ayunas",
          "desayuno",
          "cena",
          "noche",
          "antes_dormir",
        ]),
        days_of_week: z.array(z.number().min(0).max(6)).min(1, "Selecciona al menos un día"),
        reminder: z.boolean(),
      })
    )
    .min(1, "Agrega al menos un horario"),
});

export type SupplementFormValues = z.infer<typeof supplementFormSchema>;

export const stackFormSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  supplement_ids: z.array(z.string().uuid()).min(1, "Agrega al menos un suplemento"),
});

export type StackFormValues = z.infer<typeof stackFormSchema>;
