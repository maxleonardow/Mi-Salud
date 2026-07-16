import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXERCISE_MEDIA, getExerciseMedia } from "@/lib/mover/exercise-media";

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

describe("exercise media", () => {
  it.each(activePlanExercises)("covers %s with sourced real media", (exercise) => {
    const media = getExerciseMedia(exercise);

    expect(media).not.toBeNull();
    expect(media?.attribution.sourceUrl).toMatch(/^https:\/\//);
    expect(media?.src).not.toContain("/sequences/");
  });

  it("uses film for the Bulgarian split squat shown in sessions", () => {
    expect(getExerciseMedia("Sentadilla Búlgara con Mancuernas")).toMatchObject({
      kind: "video",
      src: "/videos/exercises/bulgarian-split-squat.m4v",
    });
  });

  it("does not label the two static references as video", () => {
    expect(getExerciseMedia("Remo con Mancuerna 1 Brazo")?.kind).toBe("photo");
    expect(getExerciseMedia("Dead Bug")?.kind).toBe("photo");
  });

  it("ships every referenced video, poster, and photo with the app", () => {
    for (const media of Object.values(EXERCISE_MEDIA)) {
      expect(existsSync(join(process.cwd(), "public", media.src)), media.src).toBe(true);
      if (media.kind === "video") {
        expect(existsSync(join(process.cwd(), "public", media.poster)), media.poster).toBe(true);
      }
    }
  });

  it("keeps the placeholder fallback for an unknown exercise", () => {
    expect(getExerciseMedia("Movimiento personalizado")).toBeNull();
  });
});
