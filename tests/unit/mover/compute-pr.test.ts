import { describe, it, expect } from "vitest";
import { e1rm, isPr, type PriorSetSummary } from "@/lib/mover/compute-pr";

describe("e1rm (Epley)", () => {
  it("equals weight when reps = 1", () => {
    expect(e1rm(100, 1)).toBe(100);
  });
  it("scales weight by 1 + reps/30", () => {
    expect(e1rm(60, 10)).toBeCloseTo(80, 1);
    expect(e1rm(100, 5)).toBeCloseTo(116.67, 1);
  });
  it("returns 0 for null weight or reps", () => {
    expect(e1rm(null, 5)).toBe(0);
    expect(e1rm(60, null)).toBe(0);
    expect(e1rm(null, null)).toBe(0);
  });
});

describe("isPr", () => {
  const prior: PriorSetSummary = { max_e1rm: 80 };
  it("true when new e1rm beats prior", () => {
    expect(isPr({ weight_kg: 70, reps: 10 }, prior)).toBe(true);
  });
  it("false when ties or below", () => {
    expect(isPr({ weight_kg: 60, reps: 10 }, prior)).toBe(false);
    expect(isPr({ weight_kg: 50, reps: 10 }, prior)).toBe(false);
  });
  it("true when no prior history (first ever set)", () => {
    expect(isPr({ weight_kg: 60, reps: 10 }, null)).toBe(true);
    expect(isPr({ weight_kg: 60, reps: 10 }, { max_e1rm: 0 })).toBe(true);
  });
  it("false for null weight or reps", () => {
    expect(isPr({ weight_kg: null, reps: 10 }, prior)).toBe(false);
    expect(isPr({ weight_kg: 60, reps: null }, prior)).toBe(false);
  });
});
