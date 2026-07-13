import type { Database } from "@/types/database.types";

export type Supplement = Database["public"]["Tables"]["supplements"]["Row"];
export type SupplementInsert = Database["public"]["Tables"]["supplements"]["Insert"];
export type SupplementUpdate = Database["public"]["Tables"]["supplements"]["Update"];

export type SupplementSchedule = Database["public"]["Tables"]["supplement_schedules"]["Row"];
export type SupplementScheduleInsert = Database["public"]["Tables"]["supplement_schedules"]["Insert"];

export type SupplementLog = Database["public"]["Tables"]["supplement_logs"]["Row"];
export type SupplementLogInsert = Database["public"]["Tables"]["supplement_logs"]["Insert"];

export type SupplementStack = Database["public"]["Tables"]["supplement_stacks"]["Row"];
export type SupplementStackInsert = Database["public"]["Tables"]["supplement_stacks"]["Insert"];

export type SupplementStackItem = Database["public"]["Tables"]["supplement_stack_items"]["Row"];

export type SupplementForm = Supplement["form"];
export type DoseUnit = Supplement["dose_unit"];
export type SupplementCategory = Supplement["category"];
export type TimeOfDay = SupplementSchedule["time_of_day"];

export type SupplementWithSchedules = Supplement & {
  supplement_schedules: SupplementSchedule[];
};

export type StackWithItems = SupplementStack & {
  supplement_stack_items: (SupplementStackItem & {
    supplement: Supplement;
  })[];
};

/** Scheduled item for the daily checklist */
export type DailyChecklistItem = {
  schedule: SupplementSchedule;
  supplement: Supplement;
  log: SupplementLog | null;
};

export const FORM_LABELS: Record<SupplementForm, string> = {
  capsula: "Cápsula",
  tableta: "Tableta",
  polvo: "Polvo",
  liquido: "Líquido",
  softgel: "Softgel",
};

export const UNIT_LABELS: Record<DoseUnit, string> = {
  mg: "mg",
  g: "g",
  mcg: "mcg",
  IU: "IU",
  ml: "ml",
};

export const CATEGORY_LABELS: Record<SupplementCategory, string> = {
  vitamina: "Vitamina",
  mineral: "Mineral",
  aminoacido: "Aminoácido",
  herb: "Herbal",
  probiotico: "Probiótico",
  omega: "Omega",
  otro: "Otro",
};

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  ayunas:       "En ayunas",
  desayuno:     "Con el desayuno",
  cena:         "Con la cena",
  noche:        "Por la noche",
  antes_dormir: "Antes de dormir",
};

export const TIME_OF_DAY_ORDER: TimeOfDay[] = [
  "ayunas",
  "desayuno",
  "cena",
  "noche",
  "antes_dormir",
];
