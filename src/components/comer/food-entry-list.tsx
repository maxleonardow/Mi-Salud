"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteFoodEntry } from "@/lib/comer/mutations";
import { useRecentFoodEntries, useTodayFoodEntries } from "@/lib/comer/queries";
import { MEAL_LABELS, summarizeNutrition, type FoodEntry } from "@/lib/comer/types";
import { formatAppDate } from "@/lib/date";
import { FoodEntryForm } from "./food-entry-form";
import { toast } from "sonner";

export function FoodEntryList({ recent = false }: { recent?: boolean }) {
  const todayQuery = useTodayFoodEntries();
  const recentQuery = useRecentFoodEntries();
  const query = recent ? recentQuery : todayQuery;
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const deleteMutation = useDeleteFoodEntry();

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (query.error) return <QueryError message="No pudimos cargar tus registros de alimentación." />;

  const entries = query.data ?? [];
  const summary = summarizeNutrition(entries);

  function handleDelete(entry: FoodEntry) {
    if (!window.confirm(`¿Eliminar “${entry.name}”?`)) return;
    deleteMutation.mutate(entry.id, {
      onSuccess: () => toast.success("Registro eliminado"),
      onError: () => toast.error("No se pudo eliminar"),
    });
  }

  return (
    <>
      {!recent && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-5">
          <SummaryMetric label="Calorías" value={Math.round(summary.calories)} unit="kcal" />
          <SummaryMetric label="Proteína" value={round(summary.proteinG)} unit="g" />
          <SummaryMetric label="Carbos" value={round(summary.carbsG)} unit="g" />
          <SummaryMetric label="Fibra" value={round(summary.fiberG)} unit="g" />
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {recent ? "Registros recientes" : `${summary.entries} ${summary.entries === 1 ? "registro" : "registros"} hoy`}
        </p>
        {!recent && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-3.5" /> Registrar
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {recent ? "Aún no hay historial." : "Aún no has registrado alimentos hoy."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{entry.name}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {MEAL_LABELS[entry.meal_type]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {Math.round(entry.calories)} kcal · {round(entry.protein_g)}g proteína · {round(entry.fiber_g)}g fibra
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {formatAppDate(new Date(entry.occurred_at), recent
                    ? { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }
                    : { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Editar ${entry.name}`}
                onClick={() => setEditing(entry)}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                aria-label={`Eliminar ${entry.name}`}
                onClick={() => handleDelete(entry)}
                disabled={deleteMutation.isPending}
                className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <EntryDialog open={creating} onOpenChange={setCreating} title="Registrar alimento">
        <FoodEntryForm onDone={() => setCreating(false)} />
      </EntryDialog>

      <EntryDialog
        open={!!editing}
        onOpenChange={(open) => { if (!open) setEditing(null); }}
        title="Editar registro"
      >
        {editing && <FoodEntryForm entry={editing} onDone={() => setEditing(null)} />}
      </EntryDialog>
    </>
  );
}

function SummaryMetric({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-xl border bg-card px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">
        {value} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

function EntryDialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Registra valores aproximados si no tienes una medición exacta.</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function round(value: number) {
  return Math.round(Number(value) * 10) / 10;
}
