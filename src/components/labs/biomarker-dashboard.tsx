"use client";

import { useState } from "react";
import { FlaskConical, Pencil, Plus, Trash2 } from "lucide-react";
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
import { formatDateKey } from "@/lib/date";
import { useDeleteBiomarkerResult } from "@/lib/labs/mutations";
import { useBiomarkerResults } from "@/lib/labs/queries";
import {
  classifyBiomarker,
  latestBiomarkerResults,
  STATUS_LABELS,
  type BiomarkerResult,
  type BiomarkerStatus,
} from "@/lib/labs/types";
import { BiomarkerForm } from "./biomarker-form";
import { toast } from "sonner";

const STATUS_CLASSES: Record<BiomarkerStatus, string> = {
  low: "bg-amber-100 text-amber-800",
  in_range: "bg-emerald-100 text-emerald-800",
  high: "bg-rose-100 text-rose-800",
  unrated: "bg-muted text-muted-foreground",
};

export function BiomarkerDashboard({ history = false }: { history?: boolean }) {
  const { data, isLoading, error } = useBiomarkerResults();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BiomarkerResult | null>(null);
  const deleteMutation = useDeleteBiomarkerResult();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }
  if (error) return <QueryError message="No pudimos cargar tus biomarcadores." />;

  const allResults = data ?? [];
  const displayed = history ? allResults : latestBiomarkerResults(allResults);
  const statuses = displayed.map(classifyBiomarker);
  const outOfRange = statuses.filter((status) => status === "low" || status === "high").length;

  function handleDelete(result: BiomarkerResult) {
    if (!window.confirm(`¿Eliminar el resultado de ${result.marker_name}?`)) return;
    deleteMutation.mutate(result.id, {
      onSuccess: () => toast.success("Resultado eliminado"),
      onError: () => toast.error("No se pudo eliminar"),
    });
  }

  return (
    <>
      {!history && allResults.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-2">
          <Metric label="Marcadores" value={displayed.length} />
          <Metric label="En rango" value={statuses.filter((status) => status === "in_range").length} />
          <Metric label="Fuera de rango" value={outOfRange} />
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {history ? "Todos los resultados" : "Resultados más recientes"}
        </p>
        {!history && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-3.5" /> Registrar
          </Button>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-xl border border-dashed p-7 text-center">
          <FlaskConical className="mx-auto mb-2 size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Aún no tienes resultados de laboratorio.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((result) => {
            const status = classifyBiomarker(result);
            return (
              <div key={result.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{result.marker_name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_CLASSES[status]}`}>
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {formatValue(result.value)} <span className="text-xs font-normal text-muted-foreground">{result.unit}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDateKey(result.measured_at, { day: "numeric", month: "short", year: "numeric" })}
                    {result.reference_min !== null || result.reference_max !== null
                      ? ` · rango ${result.reference_min ?? "—"}–${result.reference_max ?? "—"}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Editar ${result.marker_name}`}
                  onClick={() => setEditing(result)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Eliminar ${result.marker_name}`}
                  onClick={() => handleDelete(result)}
                  disabled={deleteMutation.isPending}
                  className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!history && (
        <p className="mt-4 text-xs text-muted-foreground">
          Los estados comparan únicamente con el rango que aparece en tu propio reporte; no constituyen una interpretación médica.
        </p>
      )}

      <ResultDialog open={creating} onOpenChange={setCreating} title="Registrar resultado">
        <BiomarkerForm onDone={() => setCreating(false)} />
      </ResultDialog>

      <ResultDialog
        open={!!editing}
        onOpenChange={(open) => { if (!open) setEditing(null); }}
        title="Editar resultado"
      >
        {editing && <BiomarkerForm result={editing} onDone={() => setEditing(null)} />}
      </ResultDialog>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card px-3 py-3 text-center">
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function ResultDialog({
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
          <DialogDescription>Copia los valores y rangos directamente del reporte del laboratorio.</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function formatValue(value: number) {
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 4 }).format(Number(value));
}
