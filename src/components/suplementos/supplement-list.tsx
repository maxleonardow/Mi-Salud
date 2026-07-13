"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useSupplements } from "@/lib/suplementos/queries";
import { useSupplementSchedules } from "@/lib/suplementos/queries";
import {
  useCreateSupplement,
  useUpdateSupplement,
  useToggleSupplement,
  useDeleteSupplement,
} from "@/lib/suplementos/mutations";
import type { SupplementFormValues } from "@/lib/suplementos/schemas";
import type { Supplement } from "@/lib/suplementos/types";
import { SupplementCard } from "./supplement-card";
import { SupplementForm } from "./supplement-form";
import { toast } from "sonner";
import { QueryError } from "@/components/ui/query-error";

export function SupplementList() {
  const { data: supplements, isLoading, error } = useSupplements();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Supplement | null>(null);

  const createMutation = useCreateSupplement();
  const updateMutation = useUpdateSupplement();
  const toggleMutation = useToggleSupplement();
  const deleteMutation = useDeleteSupplement();

  // Load schedules for the supplement being edited
  const {
    data: editSchedules,
    isLoading: editSchedulesLoading,
    error: editSchedulesError,
  } = useSupplementSchedules(editing?.id);

  function handleNew() {
    setEditing(null);
    setSheetOpen(true);
  }

  function handleEdit(sup: Supplement) {
    setEditing(sup);
    setSheetOpen(true);
  }

  function handleSubmit(values: SupplementFormValues) {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, values },
        {
          onSuccess: () => {
            toast.success("Suplemento actualizado");
            setSheetOpen(false);
            setEditing(null);
          },
          onError: () => toast.error("Error al actualizar"),
        }
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success("Suplemento agregado");
          setSheetOpen(false);
        },
        onError: () => toast.error("Error al agregar"),
      });
    }
  }

  function handleToggle(id: string, active: boolean) {
    toggleMutation.mutate(
      { id, active },
      {
        onSuccess: () =>
          toast.success(active ? "Suplemento activado" : "Suplemento desactivado"),
      }
    );
  }

  function handleDelete() {
    if (!editing) return;
    deleteMutation.mutate(editing.id, {
      onSuccess: () => {
        toast.success("Suplemento eliminado");
        setSheetOpen(false);
        setEditing(null);
      },
      onError: () => toast.error("Error al eliminar"),
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) return <QueryError message="No pudimos cargar tus suplementos." />;

  const active = (supplements ?? []).filter((s) => s.active);
  const inactive = (supplements ?? []).filter((s) => !s.active);

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={handleNew}>
          <Plus className="size-3.5" />
          Agregar
        </Button>
      </div>

      {active.length === 0 && inactive.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no tienes suplementos. Agrega tu primer suplemento.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {active.map((sup) => (
            <SupplementCard
              key={sup.id}
              supplement={sup}
              onEdit={() => handleEdit(sup)}
              onToggle={(active) => handleToggle(sup.id, active)}
            />
          ))}

          {inactive.length > 0 && (
            <>
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold pt-4 pb-1">
                Inactivos
              </p>
              {inactive.map((sup) => (
                <SupplementCard
                  key={sup.id}
                  supplement={sup}
                  onEdit={() => handleEdit(sup)}
                  onToggle={(active) => handleToggle(sup.id, active)}
                />
              ))}
            </>
          )}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editing ? "Editar suplemento" : "Nuevo suplemento"}
            </SheetTitle>
            <SheetDescription>
              {editing
                ? "Modifica los datos de tu suplemento"
                : "Agrega un suplemento a tu catálogo"}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            {editing && editSchedulesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : editSchedulesError ? (
              <QueryError message="No pudimos cargar los horarios del suplemento." />
            ) : (
              <SupplementForm
                key={editing?.id ?? "new"}
                defaultValues={
                  editing
                    ? { ...editing, supplement_schedules: editSchedules ?? [] }
                    : undefined
                }
                onSubmit={handleSubmit}
                isPending={createMutation.isPending || updateMutation.isPending}
                onCancel={() => {
                  setSheetOpen(false);
                  setEditing(null);
                }}
              />
            )}
            {editing && (
              <Button
                variant="destructive"
                className="w-full mt-3"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar suplemento"}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
