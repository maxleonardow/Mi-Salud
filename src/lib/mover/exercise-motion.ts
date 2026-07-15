export type ExerciseMotionType =
  | "squat"
  | "leg-press"
  | "split-squat"
  | "step-up"
  | "hinge"
  | "glute-bridge"
  | "chest-press"
  | "row"
  | "pulldown"
  | "shoulder-press"
  | "lateral-raise"
  | "rear-pull"
  | "curl"
  | "triceps"
  | "calf-raise"
  | "dead-bug"
  | "pallof-press";

export const EXERCISE_MOTION_TYPES: Record<string, ExerciseMotionType> = {
  "Prensa de Piernas": "leg-press",
  "Goblet Squat": "squat",
  "Sentadilla con Barra": "squat",
  "Sentadilla Búlgara con Mancuernas": "split-squat",
  "Step-up con Mancuernas": "step-up",
  "Romanian Deadlift (RDL)": "hinge",
  "Peso Muerto Convencional": "hinge",
  "Pull Through en Polea": "hinge",
  "Hip Thrust con Mancuerna": "glute-bridge",
  "Puente de Glúteos": "glute-bridge",
  "Press Banca con Mancuernas": "chest-press",
  "Press Banca Inclinado Mancuernas": "chest-press",
  "Remo con Mancuerna 1 Brazo": "row",
  "Remo Sentado en Polea": "row",
  "Jalón al Pecho (Lat Pulldown)": "pulldown",
  "Jalón Neutro al Pecho": "pulldown",
  "Press Militar Mancuernas Sentado": "shoulder-press",
  "Face Pull": "rear-pull",
  "Pájaros con Mancuernas": "rear-pull",
  "Lateral Raise con Mancuernas": "lateral-raise",
  "Elevación Lateral en Polea": "lateral-raise",
  "Curl Mancuernas Alternados": "curl",
  "Curl Martillo con Mancuernas": "curl",
  "Tríceps Push-down Cable": "triceps",
  "Extensión de Tríceps a 1 Brazo": "triceps",
  "Elevación de Pantorrilla de Pie": "calf-raise",
  "Pantorrilla en Prensa": "leg-press",
  "Dead Bug": "dead-bug",
  "Pallof Press": "pallof-press",
};

export function getExerciseMotionType(name: string) {
  return EXERCISE_MOTION_TYPES[name] ?? null;
}
