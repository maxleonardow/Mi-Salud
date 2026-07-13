"use client";

import { useRouter } from "next/navigation";
import { useActivePlan, usePlanSchedule, useTemplateExercises } from "@/lib/mover/queries";
import { useStartSession } from "@/lib/mover/mutations";
import { findScheduleSlotForToday } from "@/lib/mover/today";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/ui/query-error";

export function TodayBanner() {
  const router = useRouter();
  const { data: plan, isLoading: planLoading, error: planError } = useActivePlan();
  const { data: slots, isLoading: slotsLoading, error: slotsError } = usePlanSchedule(plan?.id);
  const slot = slots ? findScheduleSlotForToday(slots) : undefined;
  const templateId = slot?.template_id ?? undefined;
  const { data: exercises, isLoading: exLoading, error: exercisesError } = useTemplateExercises(templateId);
  const startSession = useStartSession();

  if (planLoading || slotsLoading) return <Skeleton className="h-32 w-full rounded-xl" />;

  if (planError || slotsError || exercisesError) {
    return <QueryError message="No pudimos cargar el entrenamiento de hoy." />;
  }

  if (!plan) {
    return (
      <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-alt)] p-5 text-center">
        <p className="text-sm text-muted-foreground">No tienes un plan activo. Aplica el seed SQL en Supabase para arrancar.</p>
      </div>
    );
  }

  if (!slot) {
    return (
      <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-alt)] p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Hoy</p>
        <h2 className="text-xl font-bold mt-1">Sin actividad programada</h2>
      </div>
    );
  }

  if (!templateId) {
    return (
      <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-alt)] p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Hoy · {plan.name}</p>
        <h2 className="text-2xl font-bold mt-1">{slot.activity_label}</h2>
        <p className="text-sm text-muted-foreground mt-2">No hay sesión de gym hoy. Disfruta o haz tu actividad alterna.</p>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const templateName = ((slots ?? []).find(s => s.template_id === templateId) as any)?.template?.name ?? "Workout";

  async function handleStart() {
    const session = await startSession.mutateAsync({ templateId: templateId ?? null });
    router.push(`/mover/session/${session.id}`);
  }

  return (
    <div className="rounded-xl border border-[var(--border-strong)] bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Hoy · {plan.name} · Semana {plan.current_week}</p>
      <h2 className="text-2xl font-bold mt-1">{templateName}</h2>
      {exLoading ? (
        <Skeleton className="h-20 w-full mt-3 rounded-md" />
      ) : (
        <ul className="mt-3 space-y-1 text-sm text-[var(--foreground)]/85">
          {(exercises ?? []).map(ex => (
            <li key={ex.id} className="flex justify-between">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <span>{ex.is_warmup ? "🔥 " : ""}{(ex as any).exercise?.name}</span>
              <span className="text-muted-foreground">
                {ex.prescribed_sets} × {ex.reps_min === ex.reps_max ? ex.reps_min : `${ex.reps_min}-${ex.reps_max}`}
                {ex.target_rpe ? ` · RPE ${ex.target_rpe}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Button onClick={handleStart} className="w-full mt-4" size="lg" disabled={startSession.isPending}>
        {startSession.isPending ? "Iniciando..." : "💪 Empezar entrenamiento"}
      </Button>
    </div>
  );
}
