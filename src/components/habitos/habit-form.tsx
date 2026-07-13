"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateHabit, useUpdateHabit } from "@/lib/habitos/mutations";
import { TIME_OF_DAY_LABELS, type Habit, type HabitTimeOfDay } from "@/lib/habitos/types";
import { toast } from "sonner";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type Props = {
  habit?: Habit;
  onDone: () => void;
};

export function HabitForm({ habit, onDone }: Props) {
  const [name, setName] = useState(habit?.name ?? "");
  const [emoji, setEmoji] = useState(habit?.emoji ?? "");
  const [description, setDescription] = useState(habit?.description ?? "");
  const [timeOfDay, setTimeOfDay] = useState<HabitTimeOfDay>(habit?.time_of_day ?? "manana");
  const [days, setDays] = useState<number[]>(habit?.days_of_week ?? ALL_DAYS);

  const createMutation = useCreateHabit();
  const updateMutation = useUpdateHabit();
  const isPending = createMutation.isPending || updateMutation.isPending;

  function toggleDay(d: number) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const values = {
      name: name.trim(),
      emoji: emoji.trim() || null,
      description: description.trim() || null,
      time_of_day: timeOfDay,
      days_of_week: days,
    };
    if (habit) {
      updateMutation.mutate(
        { id: habit.id, values },
        { onSuccess: () => { toast.success("Hábito actualizado"); onDone(); }, onError: () => toast.error("Error al actualizar") }
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => { toast.success("Hábito creado"); onDone(); },
        onError: () => toast.error("Error al crear"),
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <div className="w-16">
          <Label htmlFor="emoji" className="text-xs text-muted-foreground">Emoji</Label>
          <Input id="emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="☀️" maxLength={2} className="text-center text-lg" />
        </div>
        <div className="flex-1">
          <Label htmlFor="name" className="text-xs text-muted-foreground">Nombre</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Luz solar 10 min" required />
        </div>
      </div>

      <div>
        <Label htmlFor="desc" className="text-xs text-muted-foreground">Descripción (opcional)</Label>
        <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles del hábito" />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Momento del día</Label>
        <Select value={timeOfDay} onValueChange={(v) => setTimeOfDay(v as HabitTimeOfDay)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(TIME_OF_DAY_LABELS) as [HabitTimeOfDay, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Días de la semana</Label>
        <div className="flex gap-1.5 mt-1">
          {ALL_DAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                days.includes(d)
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {DAY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onDone}>Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={isPending || !name.trim()}>
          {isPending ? "Guardando..." : habit ? "Guardar" : "Crear hábito"}
        </Button>
      </div>
    </form>
  );
}
