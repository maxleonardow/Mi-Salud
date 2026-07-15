import { describe, expect, it } from "vitest";
import { getExerciseMotionType } from "@/lib/mover/exercise-motion";

const personalizedExercises = [
  "Prensa de Piernas",
  "Goblet Squat",
  "Sentadilla Búlgara con Mancuernas",
  "Step-up con Mancuernas",
  "Romanian Deadlift (RDL)",
  "Pull Through en Polea",
  "Hip Thrust con Mancuerna",
  "Puente de Glúteos",
  "Press Banca con Mancuernas",
  "Press Banca Inclinado Mancuernas",
  "Remo con Mancuerna 1 Brazo",
  "Remo Sentado en Polea",
  "Jalón al Pecho (Lat Pulldown)",
  "Jalón Neutro al Pecho",
  "Face Pull",
  "Pájaros con Mancuernas",
  "Lateral Raise con Mancuernas",
  "Elevación Lateral en Polea",
  "Curl Mancuernas Alternados",
  "Curl Martillo con Mancuernas",
  "Tríceps Push-down Cable",
  "Extensión de Tríceps a 1 Brazo",
  "Elevación de Pantorrilla de Pie",
  "Pantorrilla en Prensa",
  "Dead Bug",
  "Pallof Press",
] as const;

describe("exercise motion demos", () => {
  it.each(personalizedExercises)("covers %s", (exercise) => {
    expect(getExerciseMotionType(exercise)).not.toBeNull();
  });

  it("keeps the placeholder fallback for an unknown exercise", () => {
    expect(getExerciseMotionType("Movimiento personalizado")).toBeNull();
  });
});
