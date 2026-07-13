import { describe, expect, it } from "vitest";
import { classifyBiomarker, latestBiomarkerResults, type BiomarkerResult } from "@/lib/labs/types";

const result = (values: Partial<BiomarkerResult>): BiomarkerResult => ({
  id: "result-id",
  user_id: "user-id",
  marker_name: "Glucosa",
  value: 90,
  unit: "mg/dL",
  reference_min: 70,
  reference_max: 99,
  measured_at: "2026-07-13",
  laboratory: null,
  notes: null,
  created_at: "2026-07-13T12:00:00Z",
  updated_at: "2026-07-13T12:00:00Z",
  ...values,
});

describe("biomarker helpers", () => {
  it("classifies against report-provided ranges", () => {
    expect(classifyBiomarker(result({ value: 69 }))).toBe("low");
    expect(classifyBiomarker(result({ value: 90 }))).toBe("in_range");
    expect(classifyBiomarker(result({ value: 100 }))).toBe("high");
    expect(classifyBiomarker(result({ reference_min: null, reference_max: null }))).toBe("unrated");
  });

  it("keeps only the latest result per normalized marker", () => {
    const latest = latestBiomarkerResults([
      result({ id: "old", marker_name: "Glucosa", measured_at: "2026-01-01" }),
      result({ id: "new", marker_name: " glucosa ", measured_at: "2026-06-01" }),
      result({ id: "vit-d", marker_name: "Vitamina D", measured_at: "2026-05-01" }),
    ]);
    expect(latest.map((item) => item.id).sort()).toEqual(["new", "vit-d"]);
  });
});
