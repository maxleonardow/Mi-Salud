"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogSupplement, useUndoLog } from "@/lib/suplementos/mutations";
import { useDailyChecklist, useWeeklyAdherence } from "@/lib/suplementos/queries";
import {
  TIME_OF_DAY_LABELS,
  TIME_OF_DAY_ORDER,
  type TimeOfDay,
} from "@/lib/suplementos/types";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "./supplement-card";
import { toast } from "sonner";

export function DailyChecklist() {
  const { grouped, taken, total, isLoading } = useDailyChecklist();
  const adherence = useWeeklyAdherence();
  const logMutation = useLogSupplement();
  const undoMutation = useUndoLog();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No hay suplementos programados para hoy.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Agrega suplementos y configura horarios en la pestaña &quot;Mis Suplementos&quot;.
        </p>
      </div>
    );
  }

  const pct = total > 0 ? Math.round((taken / total) * 100) : 0;

  async function handleToggle(
    supplementId: string,
    scheduleId: string,
    logId: string | null
  ) {
    if (logId) {
      // Undo
      undoMutation.mutate(logId, {
        onError: () => toast.error("Error al deshacer"),
      });
    } else {
      // Log as taken
      logMutation.mutate(
        { supplementId, scheduleId },
        {
          onError: () => toast.error("Error al registrar"),
        }
      );
    }
  }

  return (
    <div className="space-y-5">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            {taken}/{total} tomados
          </p>
          {adherence !== null && (
            <p className="text-xs text-muted-foreground">
              Adherencia semanal: {adherence}%
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{pct}%</span>
        </div>
      </div>

      {/* Grouped by time_of_day */}
      {TIME_OF_DAY_ORDER.filter((tod) => grouped[tod]?.length > 0).map(
        (tod: TimeOfDay) => (
          <div key={tod}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
              {TIME_OF_DAY_LABELS[tod]}
            </p>
            <div className="space-y-1">
              {grouped[tod].map((item) => {
                const isTaken = item.log && !item.log.skipped;
                const Icon = CATEGORY_ICONS[item.supplement.category];
                const colorClass = CATEGORY_COLORS[item.supplement.category];
                return (
                  <button
                    key={`${item.schedule.id}-${item.supplement.id}`}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isTaken
                        ? "bg-emerald-50 dark:bg-emerald-950/20"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() =>
                      handleToggle(
                        item.supplement.id,
                        item.schedule.id,
                        item.log?.id ?? null
                      )
                    }
                    disabled={logMutation.isPending || undoMutation.isPending}
                  >
                    <Checkbox
                      checked={!!isTaken}
                      className="pointer-events-none"
                    />
                    <div className={`flex size-7 items-center justify-center rounded-md ${colorClass}`}>
                      <Icon className="size-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          isTaken ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {item.supplement.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.supplement.dose_amount} {item.supplement.dose_unit}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
}
