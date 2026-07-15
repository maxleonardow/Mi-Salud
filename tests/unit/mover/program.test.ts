import { describe, expect, it } from "vitest";
import { getWorkoutPhase, prescribedSetsForWeek } from "@/lib/mover/program";

describe("12-week workout progression", () => {
  it("starts conservatively and restores the full prescription in week two", () => {
    expect(getWorkoutPhase(1)).toMatchObject({ title: "Base técnica", targetRpe: 6, setAdjustment: -1 });
    expect(prescribedSetsForWeek(3, 1)).toBe(2);
    expect(prescribedSetsForWeek(3, 2)).toBe(3);
  });

  it("uses planned deloads without dropping below two sets", () => {
    expect(getWorkoutPhase(6)).toMatchObject({ title: "Descarga", targetRpe: 6, setAdjustment: -1 });
    expect(prescribedSetsForWeek(2, 6)).toBe(2);
    expect(prescribedSetsForWeek(3, 12)).toBe(2);
  });

  it("raises effort only after the technique and progression phases", () => {
    expect(getWorkoutPhase(5).targetRpe).toBe(7);
    expect(getWorkoutPhase(9).targetRpe).toBe(7);
    expect(getWorkoutPhase(10)).toMatchObject({ title: "Consolidación", targetRpe: 8 });
  });
});
