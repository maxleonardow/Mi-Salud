import { z } from "zod";

const optionalNumber = z.union([z.literal(""), z.coerce.number()]).transform((value) => value === "" ? null : value);

export const biomarkerResultSchema = z.object({
  marker_name: z.string().trim().min(1, "Biomarcador requerido").max(120),
  value: z.coerce.number({ error: "Valor requerido" }),
  unit: z.string().trim().min(1, "Unidad requerida").max(40),
  reference_min: optionalNumber,
  reference_max: optionalNumber,
  measured_at: z.string().date("Fecha inválida"),
  laboratory: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
}).refine(
  (values) => values.reference_min === null || values.reference_max === null || values.reference_min <= values.reference_max,
  { message: "El mínimo no puede superar al máximo", path: ["reference_max"] }
);

export type BiomarkerResultFormValues = z.infer<typeof biomarkerResultSchema>;
