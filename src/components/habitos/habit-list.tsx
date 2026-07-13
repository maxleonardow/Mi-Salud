"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteHabit, useToggleHabit } from "@/lib/habitos/mutations";
import { useHabits } from "@/lib/habitos/queries";
import { TIME_OF_DAY_LABELS, type Habit } from "@/lib/habitos/types";
import { HabitForm } from "./habit-form";
import { toast } from "sonner";

export function HabitList() {
  const { data: habits, isLoading } = useHabits();
  const deleteMutation = useDeleteHabit();
  const toggleMutation = useToggleHabit();
  const [editing, setEditing] = useState<Habit | null>(null);
  const [creating, setCreating] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Hábito eliminado"),
      onError: () => toast.error("Error al eliminar"),
    });
  }

  return (
    <>
      <div className="space-y-2">
        {(habits ?? []).map((h) => (
          <div
            key={h.id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-opacity ${
              h.active ? "" : "opacity-50"
            }`}
          >
            <button
              className="flex-shrink-0"
              onClick={() => toggleMutation.mutate({ id: h.id, active: !h.active })}
              title={h.active ? "Desactivar" : "Activar"}
            >
              <div className={`h-2 w-2 rounded-full ${h.active ? "bg-violet-500" : "bg-muted-foreground"}`} />
            </button>
            {h.emoji && <span className="text-base">{h.emoji}</span>}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{h.name}</p>
              <p className="text-xs text-muted-foreground">{TIME_OF_DAY_LABELS[h.time_of_day]}</p>
            </div>
            <button onClick={() => setEditing(h)} className="text-muted-foreground hover:text-foreground transition-colors">
              <Pencil className="size-3.5" />
            </button>
            <button onClick={() => handleDelete(h.id)} className="text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}

        {(habits ?? []).length === 0 && (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">Aún no tienes hábitos.</p>
          </div>
        )}
      </div>

      <Button variant="outline" className="w-full mt-4" onClick={() => setCreating(true)}>
        <Plus className="size-4 mr-2" /> Agregar hábito
      </Button>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo hábito</DialogTitle></DialogHeader>
          <HabitForm onDone={() => setCreating(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar hábito</DialogTitle></DialogHeader>
          {editing && <HabitForm habit={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
