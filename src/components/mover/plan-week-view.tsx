"use client";

import { useActivePlan, usePlanSchedule } from "@/lib/mover/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { dayOfWeek } from "@/lib/mover/today";
import { QueryError } from "@/components/ui/query-error";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function PlanWeekView() {
  const { data: plan, isLoading: planLoading, error: planError } = useActivePlan();
  const { data: slots, isLoading: slotsLoading, error: slotsError } = usePlanSchedule(plan?.id);
  const todayDow = dayOfWeek(new Date());

  if (planLoading || slotsLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (planError || slotsError) return <QueryError message="No pudimos cargar tu plan semanal." />;
  if (!plan) return <p className="text-sm text-muted-foreground">Sin plan activo.</p>;

  const ordered = [1, 2, 3, 4, 5, 6, 0].map(dow => {
    const slot = (slots ?? []).find(s => s.day_of_week === dow);
    return { dow, slot };
  });

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{plan.name}</p>
          <p className="text-sm">Semana {plan.current_week} de {plan.mesocycle_weeks}</p>
        </div>
      </div>
      {ordered.map(({ dow, slot }) => {
        const isToday = dow === todayDow;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const label = (slot as any)?.template?.name ?? slot?.activity_label ?? "—";
        const hasWorkout = !!slot?.template_id;
        return (
          <div
            key={dow}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${isToday ? "border-primary bg-[var(--accent-bg)]" : "border-[var(--border-strong)] bg-white"}`}
          >
            <span className={`text-xs font-bold uppercase tracking-wide w-12 ${isToday ? "text-primary" : "text-muted-foreground"}`}>{DAY_NAMES[dow]}</span>
            <span className={`flex-1 text-sm font-medium ${hasWorkout ? "" : "text-muted-foreground"}`}>{label}</span>
            {isToday && <span className="text-[10px] uppercase font-bold text-primary">Hoy</span>}
          </div>
        );
      })}
    </div>
  );
}
