"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { foodEntrySchema, type FoodEntryFormValues } from "@/lib/comer/schemas";
import { MEAL_LABELS, type FoodEntry, type MealType } from "@/lib/comer/types";
import { useCreateFoodEntry, useUpdateFoodEntry } from "@/lib/comer/mutations";
import { toast } from "sonner";

type Props = {
  entry?: FoodEntry;
  onDone: () => void;
};

export function FoodEntryForm({ entry, onDone }: Props) {
  const [name, setName] = useState(entry?.name ?? "");
  const [mealType, setMealType] = useState<MealType>(entry?.meal_type ?? "comida");
  const [calories, setCalories] = useState(String(entry?.calories ?? ""));
  const [protein, setProtein] = useState(String(entry?.protein_g ?? ""));
  const [carbs, setCarbs] = useState(String(entry?.carbs_g ?? ""));
  const [fat, setFat] = useState(String(entry?.fat_g ?? ""));
  const [fiber, setFiber] = useState(String(entry?.fiber_g ?? ""));
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateFoodEntry();
  const updateMutation = useUpdateFoodEntry();
  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = foodEntrySchema.safeParse({
      name,
      meal_type: mealType,
      calories: calories || 0,
      protein_g: protein || 0,
      carbs_g: carbs || 0,
      fat_g: fat || 0,
      fiber_g: fiber || 0,
      notes,
    });

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? "Revisa los valores");
      return;
    }

    const options = {
      onSuccess: () => {
        toast.success(entry ? "Registro actualizado" : "Comida registrada");
        onDone();
      },
      onError: () => toast.error("No se pudo guardar el registro"),
    };

    if (entry) {
      updateMutation.mutate({ id: entry.id, values: result.data as FoodEntryFormValues }, options);
    } else {
      createMutation.mutate(result.data as FoodEntryFormValues, options);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="food-name">Alimento o platillo</Label>
        <Input
          id="food-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej. Tacos de pollo"
          autoFocus
        />
      </div>

      <div>
        <Label>Momento</Label>
        <Select value={mealType} onValueChange={(value) => setMealType(value as MealType)}>
          <SelectTrigger className="mt-1 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(MEAL_LABELS) as [MealType, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField id="calories" label="Calorías" unit="kcal" value={calories} onChange={setCalories} />
        <NumberField id="protein" label="Proteína" unit="g" value={protein} onChange={setProtein} />
        <NumberField id="carbs" label="Carbohidratos" unit="g" value={carbs} onChange={setCarbs} />
        <NumberField id="fat" label="Grasa" unit="g" value={fat} onChange={setFat} />
        <NumberField id="fiber" label="Fibra" unit="g" value={fiber} onChange={setFiber} />
      </div>

      <div>
        <Label htmlFor="food-notes">Notas (opcional)</Label>
        <Input
          id="food-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Porción, ingredientes o contexto"
        />
      </div>

      {formError && <p role="alert" className="text-xs text-destructive">{formError}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onDone}>Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={isPending || !name.trim()}>
          {isPending ? "Guardando..." : entry ? "Guardar" : "Registrar"}
        </Button>
      </div>
    </form>
  );
}

function NumberField({
  id,
  label,
  unit,
  value,
  onChange,
}: {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1">
        <Input
          id={id}
          type="number"
          min="0"
          step="0.1"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pr-12"
          placeholder="0"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {unit}
        </span>
      </div>
    </div>
  );
}
