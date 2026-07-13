"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, GripVertical, Trash2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useStacks, useSupplements } from "@/lib/suplementos/queries";
import {
  useCreateStack,
  useUpdateStack,
  useDeleteStack,
} from "@/lib/suplementos/mutations";
import { stackFormSchema, type StackFormValues } from "@/lib/suplementos/schemas";
import type { StackWithItems } from "@/lib/suplementos/types";
import { SupplementCard } from "./supplement-card";
import { toast } from "sonner";
import { QueryError } from "@/components/ui/query-error";

export function StackBuilder() {
  const { data: stacks, isLoading: stacksLoading, error: stacksError } = useStacks();
  const { data: supplements, isLoading: supsLoading, error: supsError } = useSupplements();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<StackWithItems | null>(null);

  const createMutation = useCreateStack();
  const updateMutation = useUpdateStack();
  const deleteMutation = useDeleteStack();

  const form = useForm<StackFormValues>({
    resolver: zodResolver(stackFormSchema),
    defaultValues: {
      name: "",
      description: "",
      supplement_ids: [],
    },
  });

  function handleNew() {
    setEditing(null);
    form.reset({ name: "", description: "", supplement_ids: [] });
    setSheetOpen(true);
  }

  function handleEdit(stack: StackWithItems) {
    setEditing(stack);
    form.reset({
      name: stack.name,
      description: stack.description ?? "",
      supplement_ids: stack.supplement_stack_items.map((i) => i.supplement_id),
    });
    setSheetOpen(true);
  }

  function handleSubmit(values: StackFormValues) {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, values },
        {
          onSuccess: () => {
            toast.success("Stack actualizado");
            setSheetOpen(false);
            setEditing(null);
          },
          onError: () => toast.error("Error al actualizar"),
        }
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success("Stack creado");
          setSheetOpen(false);
        },
        onError: () => toast.error("Error al crear"),
      });
    }
  }

  function handleDelete() {
    if (!editing) return;
    deleteMutation.mutate(editing.id, {
      onSuccess: () => {
        toast.success("Stack eliminado");
        setSheetOpen(false);
        setEditing(null);
      },
      onError: () => toast.error("Error al eliminar"),
    });
  }

  const isLoading = stacksLoading || supsLoading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (stacksError || supsError) {
    return <QueryError message="No pudimos cargar tus stacks de suplementos." />;
  }

  const activeSups = (supplements ?? []).filter((s) => s.active);

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={handleNew}>
          <Plus className="size-3.5" />
          Nuevo Stack
        </Button>
      </div>

      {(stacks ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <Layers className="size-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            No tienes stacks. Crea agrupaciones de suplementos.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Ej: &quot;Stack Mañana&quot;, &quot;Pre-Workout&quot;, &quot;Stack Noche&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(stacks ?? []).map((stack) => (
            <Card
              key={stack.id}
              size="sm"
              className="cursor-pointer"
              onClick={() => handleEdit(stack)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="size-4 text-muted-foreground" />
                  {stack.name}
                </CardTitle>
                {stack.description && (
                  <p className="text-xs text-muted-foreground">
                    {stack.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-0.5">
                  {stack.supplement_stack_items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <GripVertical className="size-3 text-muted-foreground/40" />
                      <span className="text-muted-foreground text-xs w-4">
                        {idx + 1}.
                      </span>
                      <SupplementCard
                        supplement={item.supplement}
                        compact
                      />
                    </div>
                  ))}
                  {stack.supplement_stack_items.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      Sin suplementos
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stack form sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editing ? "Editar stack" : "Nuevo stack"}
            </SheetTitle>
            <SheetDescription>
              {editing
                ? "Modifica tu agrupación de suplementos"
                : "Crea una agrupación de suplementos"}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <Input placeholder="Stack Mañana" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción (opcional)</FormLabel>
                      <Input
                        placeholder="Mis suplementos de la mañana"
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Supplement selector */}
                <FormField
                  control={form.control}
                  name="supplement_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suplementos</FormLabel>
                      <div className="space-y-1 rounded-lg border p-2 max-h-60 overflow-y-auto">
                        {activeSups.length === 0 ? (
                          <p className="text-xs text-muted-foreground p-2">
                            No hay suplementos activos. Agrega algunos primero.
                          </p>
                        ) : (
                          activeSups.map((sup) => {
                            const selected = (
                              field.value as string[]
                            ).includes(sup.id);
                            return (
                              <label
                                key={sup.id}
                                className="flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-muted/50"
                              >
                                <Checkbox
                                  checked={selected}
                                  onCheckedChange={(checked) => {
                                    const current = field.value as string[];
                                    field.onChange(
                                      checked
                                        ? [...current, sup.id]
                                        : current.filter(
                                            (id) => id !== sup.id
                                          )
                                    );
                                  }}
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {sup.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {sup.dose_amount} {sup.dose_unit}
                                  </p>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Selected order preview */}
                {form.watch("supplement_ids").length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Orden (arrastra para reordenar):
                    </p>
                    <div className="space-y-1">
                      {form.watch("supplement_ids").map((id, idx) => {
                        const sup = activeSups.find((s) => s.id === id);
                        if (!sup) return null;
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-2 rounded-md bg-muted/30 px-2 py-1"
                          >
                            <GripVertical className="size-3 text-muted-foreground/40" />
                            <span className="text-xs text-muted-foreground">
                              {idx + 1}.
                            </span>
                            <span className="text-sm">{sup.name}</span>
                            <button
                              type="button"
                              className="ml-auto"
                              onClick={() => {
                                const ids = form.getValues("supplement_ids");
                                form.setValue(
                                  "supplement_ids",
                                  ids.filter((i) => i !== id)
                                );
                              }}
                            >
                              <Trash2 className="size-3 text-muted-foreground" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSheetOpen(false);
                      setEditing(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Guardando..."
                      : editing
                        ? "Actualizar"
                        : "Crear Stack"}
                  </Button>
                </div>
              </form>
            </Form>

            {editing && (
              <Button
                variant="destructive"
                className="w-full mt-3"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending
                  ? "Eliminando..."
                  : "Eliminar stack"}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
