"use client";

import { useMemo, useState } from "react";
import { BookOpen, Dumbbell, Play, Replace, Search } from "lucide-react";
import { useActivePlan, usePlanExerciseLibrary, type PlanExerciseLibraryItem } from "@/lib/mover/queries";
import { ExerciseVisual } from "@/components/mover/exercise-visual";
import { DefaultPlanInstaller } from "@/components/mover/default-plan-installer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { getExerciseMedia } from "@/lib/mover/exercise-media";

const MUSCLE_NAMES: Record<string, string> = {
  back: "Espalda",
  biceps: "Bíceps",
  calves: "Pantorrillas",
  chest: "Pecho",
  core: "Core",
  forearms: "Antebrazo",
  glutes: "Glúteos",
  hamstrings: "Isquios",
  lats: "Dorsales",
  quads: "Cuádriceps",
  rear_delts: "Deltoide posterior",
  shoulders: "Hombros",
  traps: "Trapecio",
  triceps: "Tríceps",
  upper_back: "Espalda alta",
};

const EQUIPMENT_NAMES: Record<string, string> = {
  barbell: "Barra",
  bench: "Banco",
  bodyweight: "Peso corporal",
  cable: "Polea",
  dumbbell: "Mancuernas",
  leg_press: "Prensa",
  machine: "Máquina",
};

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function ExerciseDetail({ exercise }: { exercise: PlanExerciseLibraryItem }) {
  const hasVideo = getExerciseMedia(exercise.name)?.kind === "video";

  return (
    <DialogContent className="max-h-[92svh] overflow-y-auto p-0 sm:max-w-2xl">
      <ExerciseVisual
        name={exercise.name}
        imageUrl={exercise.image_url}
        className="aspect-video w-full rounded-t-xl"
      />
      <div className="space-y-4 px-4 pb-5">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 pr-10">
            <Badge>{hasVideo ? "Video" : "Fotografía"}</Badge>
            {exercise.template_names.map(templateName => (
              <Badge key={templateName} variant="outline">{templateName}</Badge>
            ))}
          </div>
          <DialogTitle className="text-xl">{exercise.name}</DialogTitle>
          <DialogDescription>
            Demostración, puntos de técnica y alternativas disponibles dentro de tu plan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {exercise.muscle_groups.map(muscle => (
            <span key={muscle} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {MUSCLE_NAMES[muscle] ?? muscle}
            </span>
          ))}
        </div>

        {exercise.technique && (
          <section className="rounded-xl bg-[var(--accent-bg)] p-4">
            <h3 className="text-sm font-semibold">Cómo hacerlo</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{exercise.technique}</p>
          </section>
        )}

        {exercise.equipment.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Equipo</p>
            <p className="mt-1 text-sm">{exercise.equipment.map(item => EQUIPMENT_NAMES[item] ?? item).join(" · ")}</p>
          </div>
        )}

        {exercise.alternatives.length > 0 && (
          <section className="rounded-xl border border-dashed border-primary/30 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Replace className="size-4" /> Alternativas
            </h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {exercise.alternatives.map(alternative => (
                <div key={alternative.id} className="rounded-lg bg-muted/60 px-3 py-2.5">
                  <p className="text-sm font-medium">{alternative.name}</p>
                  {alternative.equipment.length > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {alternative.equipment.map(item => EQUIPMENT_NAMES[item] ?? item).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </DialogContent>
  );
}

export function ExerciseLibrary() {
  const { data: plan, isLoading: planLoading, error: planError } = useActivePlan();
  const { data: exercises, isLoading: libraryLoading, error: libraryError } = usePlanExerciseLibrary(plan?.id);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PlanExerciseLibraryItem | null>(null);

  const filteredExercises = useMemo(() => {
    const query = normalizeSearch(search.trim());
    if (!query) return exercises ?? [];

    return (exercises ?? []).filter(exercise => normalizeSearch([
      exercise.name,
      ...exercise.muscle_groups.map(muscle => MUSCLE_NAMES[muscle] ?? muscle),
      ...exercise.equipment.map(item => EQUIPMENT_NAMES[item] ?? item),
      ...exercise.template_names,
    ].join(" ")).includes(query));
  }, [exercises, search]);

  if (planLoading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (planError) return <QueryError message="No pudimos cargar tu plan activo." />;
  if (!plan) return <DefaultPlanInstaller />;

  return (
    <div className="space-y-5">
      <Card className="gap-0 py-0">
        <CardHeader className="border-b bg-[var(--accent-bg)] py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                <BookOpen className="size-4" /> Biblioteca de tu plan
              </p>
              <CardTitle className="mt-1 text-xl">Todos tus ejercicios, siempre disponibles</CardTitle>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Consulta la demostración y la técnica cualquier día, sin iniciar una sesión ni esperar a que toque esa rutina.
              </p>
            </div>
            <Badge variant="secondary">{exercises?.length ?? 0} ejercicios</Badge>
          </div>
        </CardHeader>
        <CardContent className="py-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <span className="sr-only">Buscar ejercicios</span>
            <Input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar por ejercicio, músculo, equipo o rutina"
              className="h-10 pl-9"
            />
          </label>
        </CardContent>
      </Card>

      {libraryLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      )}
      {libraryError && <QueryError message="No pudimos cargar la biblioteca de ejercicios." />}

      {!libraryLoading && !libraryError && filteredExercises.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No encontramos ejercicios con “{search}”.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredExercises.map(exercise => {
          const hasVideo = getExerciseMedia(exercise.name)?.kind === "video";
          return (
            <Card key={exercise.id} className="gap-0 overflow-hidden py-0">
              <ExerciseVisual
                name={exercise.name}
                imageUrl={exercise.image_url}
                animate={false}
                className="aspect-video w-full"
              />
              <CardContent className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold leading-tight">{exercise.name}</h3>
                    <Badge variant="outline" className="shrink-0">{hasVideo ? "Video" : "Foto"}</Badge>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {exercise.technique ?? "Consulta la demostración y realiza el movimiento con control."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {exercise.muscle_groups.slice(0, 3).map(muscle => (
                    <span key={muscle} className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                      {MUSCLE_NAMES[muscle] ?? muscle}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Dumbbell className="size-3.5" /> {exercise.template_names.length} {exercise.template_names.length === 1 ? "rutina" : "rutinas"}
                  </span>
                  <Button type="button" size="sm" onClick={() => setSelected(exercise)}>
                    <Play className="size-3.5" /> Ver detalle
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={selected !== null} onOpenChange={open => { if (!open) setSelected(null); }}>
        {selected && <ExerciseDetail exercise={selected} />}
      </Dialog>
    </div>
  );
}
