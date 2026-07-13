"use client";

import Link from "next/link";
import { ArrowRight, Utensils } from "lucide-react";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { useTodayFoodEntries } from "@/lib/comer/queries";
import { summarizeNutrition } from "@/lib/comer/types";

export function NutritionTodayCard() {
  const { data, isLoading, error } = useTodayFoodEntries();

  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />;
  if (error) return <QueryError message="No pudimos cargar la alimentación de hoy." />;

  const summary = summarizeNutrition(data ?? []);

  return (
    <Link
      href="/comer"
      className="flex items-center gap-3 rounded-xl border border-[var(--border-strong)] bg-card p-4 transition-colors hover:bg-muted/40"
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
        <Utensils className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {summary.entries === 0
            ? "Sin alimentos registrados"
            : `${summary.entries} ${summary.entries === 1 ? "registro" : "registros"} · ${Math.round(summary.calories)} kcal`}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {summary.entries === 0
            ? "Registra tu primera comida del día"
            : `${Math.round(summary.proteinG)}g proteína · ${Math.round(summary.fiberG)}g fibra`}
        </p>
      </div>
      <ArrowRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
