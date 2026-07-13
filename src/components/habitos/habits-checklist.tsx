"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogHabit, useUndoHabitLog } from "@/lib/habitos/mutations";
import { useTodayHabits } from "@/lib/habitos/queries";
import { TIME_OF_DAY_LABELS, TIME_OF_DAY_ORDER, type HabitTimeOfDay } from "@/lib/habitos/types";
import { toast } from "sonner";

export function HabitsChecklist() {
  const { grouped, done, total, isLoading } = useTodayHabits();
  const logMutation = useLogHabit();
  const undoMutation = useUndoHabitLog();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">No hay hábitos para hoy.</p>
        <p className="text-xs text-muted-foreground mt-1">Agrégalos en la sección Hábitos.</p>
      </div>
    );
  }

  async function handleToggle(habitId: string, logId: string | null) {
    if (logId) {
      undoMutation.mutate(logId, { onError: () => toast.error("Error al deshacer") });
    } else {
      logMutation.mutate(habitId, { onError: () => toast.error("Error al registrar") });
    }
  }

  const isPending = logMutation.isPending || undoMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{done}/{total} completados</p>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-300"
              style={{ width: total > 0 ? `${Math.round((done / total) * 100)}%` : "0%" }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {total > 0 ? Math.round((done / total) * 100) : 0}%
          </span>
        </div>
      </div>

      {TIME_OF_DAY_ORDER.filter((tod) => grouped[tod]?.length > 0).map((tod: HabitTimeOfDay) => (
        <div key={tod}>
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
            {TIME_OF_DAY_LABELS[tod]}
          </p>
          <div className="space-y-1">
            {grouped[tod].map((habit) => {
              const isDone = habit.log !== null;
              return (
                <button
                  key={habit.id}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    isDone ? "bg-violet-50 dark:bg-violet-950/20" : "hover:bg-muted/50"
                  }`}
                  onClick={() => handleToggle(habit.id, habit.log?.id ?? null)}
                  disabled={isPending}
                >
                  <Checkbox checked={isDone} className="pointer-events-none" />
                  {habit.emoji && (
                    <span className="text-base leading-none">{habit.emoji}</span>
                  )}
                  <p className={`text-sm font-medium flex-1 ${isDone ? "line-through text-muted-foreground" : ""}`}>
                    {habit.name}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
