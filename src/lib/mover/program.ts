export type WorkoutPhase = {
  title: string;
  summary: string;
  targetRpe: number;
  setAdjustment: number;
};

export function getWorkoutPhase(week: number): WorkoutPhase {
  if (week <= 2) {
    return {
      title: "Base técnica",
      summary: "Aprende los movimientos, termina cada serie con 3-4 repeticiones posibles y registra cargas de referencia.",
      targetRpe: 6,
      setAdjustment: week === 1 ? -1 : 0,
    };
  }

  if (week <= 5) {
    return {
      title: "Construcción",
      summary: "Cuando completes el máximo de repeticiones con buena técnica, aumenta la carga en el siguiente entrenamiento.",
      targetRpe: 7,
      setAdjustment: 0,
    };
  }

  if (week === 6) {
    return {
      title: "Descarga",
      summary: "Reduce una serie por ejercicio y conserva cargas cómodas para disipar fatiga.",
      targetRpe: 6,
      setAdjustment: -1,
    };
  }

  if (week <= 9) {
    return {
      title: "Progresión",
      summary: "Busca una repetición adicional o un pequeño aumento de carga sin sacrificar el rango de movimiento.",
      targetRpe: 7,
      setAdjustment: 0,
    };
  }

  if (week <= 11) {
    return {
      title: "Consolidación",
      summary: "Trabaja cerca del límite técnico, dejando aproximadamente dos repeticiones posibles en cada serie.",
      targetRpe: 8,
      setAdjustment: 0,
    };
  }

  return {
    title: "Evaluación y recuperación",
    summary: "Reduce una serie, evita el fallo y compara cargas, repeticiones, peso y cintura con el inicio.",
    targetRpe: 6,
    setAdjustment: -1,
  };
}

export function prescribedSetsForWeek(baseSets: number, week: number) {
  const { setAdjustment } = getWorkoutPhase(week);
  return Math.max(2, baseSets + setAdjustment);
}
