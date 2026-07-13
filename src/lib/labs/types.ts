import type { Database } from "@/types/database.types";

export type BiomarkerResult = Database["public"]["Tables"]["biomarker_results"]["Row"];

export type BiomarkerStatus = "low" | "in_range" | "high" | "unrated";

export function classifyBiomarker(result: BiomarkerResult): BiomarkerStatus {
  const value = Number(result.value);
  if (result.reference_min !== null && value < Number(result.reference_min)) return "low";
  if (result.reference_max !== null && value > Number(result.reference_max)) return "high";
  if (result.reference_min !== null || result.reference_max !== null) return "in_range";
  return "unrated";
}

export function latestBiomarkerResults(results: BiomarkerResult[]): BiomarkerResult[] {
  const latest = new Map<string, BiomarkerResult>();
  for (const result of results) {
    const key = result.marker_name.trim().toLocaleLowerCase("es-MX");
    const current = latest.get(key);
    if (!current || result.measured_at > current.measured_at) latest.set(key, result);
  }
  return [...latest.values()].sort((a, b) => a.marker_name.localeCompare(b.marker_name, "es-MX"));
}

export const STATUS_LABELS: Record<BiomarkerStatus, string> = {
  low: "Bajo",
  in_range: "En rango",
  high: "Alto",
  unrated: "Sin rango",
};
