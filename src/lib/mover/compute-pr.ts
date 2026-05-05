export type PriorSetSummary = { max_e1rm: number } | null;

export function e1rm(weight: number | null, reps: number | null): number {
  if (weight == null || reps == null || weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function isPr(
  newSet: { weight_kg: number | null; reps: number | null },
  prior: PriorSetSummary
): boolean {
  const newE = e1rm(newSet.weight_kg, newSet.reps);
  if (newE <= 0) return false;
  if (!prior || prior.max_e1rm <= 0) return true;
  return newE > prior.max_e1rm;
}
