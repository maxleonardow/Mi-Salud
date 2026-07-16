export type ExercisePhotoSequence = {
  start: string;
  end: string;
};

const sequence = (slug: string): ExercisePhotoSequence => ({
  start: `/images/exercises/sequences/${slug}-a.webp`,
  end: `/images/exercises/sequences/${slug}-b.webp`,
});

export const EXERCISE_PHOTO_SEQUENCES: Record<string, ExercisePhotoSequence> = {
  "Prensa de Piernas": sequence("leg-press"),
  "Goblet Squat": sequence("goblet-squat"),
  "Sentadilla con Barra": sequence("barbell-back-squat"),
  "Sentadilla Búlgara con Mancuernas": sequence("bulgarian-split-squat"),
  "Romanian Deadlift (RDL)": sequence("romanian-deadlift"),
  "Peso Muerto Convencional": sequence("conventional-deadlift"),
  "Hip Thrust con Mancuerna": sequence("dumbbell-hip-thrust"),
  "Press Banca con Mancuernas": sequence("dumbbell-bench-press"),
  "Press Banca Inclinado Mancuernas": sequence("incline-dumbbell-bench-press"),
  "Remo con Mancuerna 1 Brazo": sequence("one-arm-dumbbell-row"),
  "Jalón al Pecho (Lat Pulldown)": sequence("lat-pulldown"),
  "Press Militar Mancuernas Sentado": sequence("seated-dumbbell-overhead-press"),
  "Face Pull": sequence("face-pull"),
  "Lateral Raise con Mancuernas": sequence("dumbbell-lateral-raise"),
  "Curl Mancuernas Alternados": sequence("alternating-dumbbell-curl"),
  "Tríceps Push-down Cable": sequence("cable-triceps-pushdown"),
  "Elevación de Pantorrilla de Pie": sequence("standing-calf-raise"),
  "Dead Bug": sequence("dead-bug"),
};

export function getExercisePhotoSequence(name: string) {
  return EXERCISE_PHOTO_SEQUENCES[name] ?? null;
}
