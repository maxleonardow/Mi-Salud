import { describe, expect, it } from "vitest";
import { getExercisePhotoSequence } from "@/lib/mover/exercise-media";

const activePlanExercises = [
  "Prensa de Piernas",
  "Sentadilla Búlgara con Mancuernas",
  "Romanian Deadlift (RDL)",
  "Hip Thrust con Mancuerna",
  "Press Banca con Mancuernas",
  "Press Banca Inclinado Mancuernas",
  "Remo con Mancuerna 1 Brazo",
  "Jalón al Pecho (Lat Pulldown)",
  "Face Pull",
  "Lateral Raise con Mancuernas",
  "Curl Mancuernas Alternados",
  "Tríceps Push-down Cable",
  "Elevación de Pantorrilla de Pie",
  "Dead Bug",
] as const;

describe("exercise photo sequences", () => {
  it.each(activePlanExercises)("covers %s with two optimized frames", (exercise) => {
    const sequence = getExercisePhotoSequence(exercise);

    expect(sequence).not.toBeNull();
    expect(sequence?.start).toMatch(/-a\.webp$/);
    expect(sequence?.end).toMatch(/-b\.webp$/);
  });

  it("keeps the placeholder fallback for an unknown exercise", () => {
    expect(getExercisePhotoSequence("Movimiento personalizado")).toBeNull();
  });
});
