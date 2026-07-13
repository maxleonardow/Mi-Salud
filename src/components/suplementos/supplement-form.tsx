"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplementFormSchema, type SupplementFormValues } from "@/lib/suplementos/schemas";
import {
  FORM_LABELS,
  UNIT_LABELS,
  CATEGORY_LABELS,
  TIME_OF_DAY_LABELS,
  type SupplementForm as FormType,
  type DoseUnit,
  type SupplementCategory,
  type TimeOfDay,
  type Supplement,
  type SupplementSchedule,
} from "@/lib/suplementos/types";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";

const DAYS = ["D", "L", "M", "Mi", "J", "V", "S"] as const;

type Props = {
  defaultValues?: Supplement & { supplement_schedules?: SupplementSchedule[] };
  onSubmit: (values: SupplementFormValues) => void;
  isPending: boolean;
  onCancel: () => void;
};

export function SupplementForm({
  defaultValues,
  onSubmit,
  isPending,
  onCancel,
}: Props) {
  const form = useForm<SupplementFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(supplementFormSchema) as any,
    defaultValues: {
      name: defaultValues?.name ?? "",
      brand: defaultValues?.brand ?? "",
      form: defaultValues?.form ?? "capsula",
      dose_amount: defaultValues?.dose_amount ?? ("" as unknown as number),
      dose_unit: defaultValues?.dose_unit ?? "mg",
      category: defaultValues?.category ?? "vitamina",
      notes: defaultValues?.notes ?? "",
      schedules: defaultValues?.supplement_schedules?.map((s) => ({
        time_of_day: s.time_of_day,
        days_of_week: s.days_of_week,
        reminder: s.reminder,
      })) ?? [
        {
          time_of_day: "ayunas" as TimeOfDay,
          days_of_week: [0, 1, 2, 3, 4, 5, 6],
          reminder: false,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "schedules",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <Input placeholder="Vitamina D3" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Brand */}
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca (opcional)</FormLabel>
              <Input placeholder="Now Foods" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category + Form row */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABELS) as SupplementCategory[]).map(
                      (key) => (
                        <SelectItem key={key} value={key}>
                          {CATEGORY_LABELS[key]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="form"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forma</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FORM_LABELS) as FormType[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {FORM_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Dose + Unit row */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="dose_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dosis</FormLabel>
                <Input type="number" step="any" min="0" placeholder="5000" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dose_unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(UNIT_LABELS) as DoseUnit[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {UNIT_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <Input placeholder="Tomar con grasa para mejor absorción" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Schedules */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <FormLabel>Horarios</FormLabel>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() =>
                append({
                  time_of_day: "ayunas",
                  days_of_week: [0, 1, 2, 3, 4, 5, 6],
                  reminder: false,
                })
              }
            >
              <Plus className="size-3" />
              Agregar
            </Button>
          </div>

          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="rounded-lg border p-3 mb-2 space-y-2"
            >
              <div className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name={`schedules.${idx}.time_of_day`}
                  render={({ field: f }) => (
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.keys(TIME_OF_DAY_LABELS) as TimeOfDay[]
                        ).map((key) => (
                          <SelectItem key={key} value={key}>
                            {TIME_OF_DAY_LABELS[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => remove(idx)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>

              {/* Days of week selector */}
              <FormField
                control={form.control}
                name={`schedules.${idx}.days_of_week`}
                render={({ field: f }) => (
                  <div className="flex gap-1">
                    {DAYS.map((dayLabel, dayIdx) => {
                      const selected = (f.value as number[]).includes(dayIdx);
                      return (
                        <button
                          key={dayIdx}
                          type="button"
                          onClick={() => {
                            const current = f.value as number[];
                            f.onChange(
                              selected
                                ? current.filter((d) => d !== dayIdx)
                                : [...current, dayIdx].sort()
                            );
                          }}
                          className={`flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {dayLabel}
                        </button>
                      );
                    })}
                  </div>
                )}
              />

              {/* Reminder toggle */}
              <FormField
                control={form.control}
                name={`schedules.${idx}.reminder`}
                render={({ field: f }) => (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <Checkbox
                      checked={f.value}
                      onCheckedChange={f.onChange}
                    />
                    Recordatorio
                  </label>
                )}
              />
            </div>
          ))}
          {form.formState.errors.schedules?.message && (
            <p className="text-destructive text-sm">
              {form.formState.errors.schedules.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? "Guardando..." : defaultValues ? "Actualizar" : "Agregar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
