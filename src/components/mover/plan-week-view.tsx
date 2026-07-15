"use client";

import {
  CalendarDays,
  Clock3,
  Dumbbell,
  Flame,
  Gauge,
  HeartPulse,
  Repeat2,
} from "lucide-react";
import { useActivePlan, usePlanSchedule, useTemplateExercises } from "@/lib/mover/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { dayOfWeek } from "@/lib/mover/today";
import { QueryError } from "@/components/ui/query-error";
import { DefaultPlanInstaller } from "@/components/mover/default-plan-installer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExerciseVisual } from "@/components/mover/exercise-visual";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_NAMES_LONG = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const MUSCLE_NAMES: Record<string, string> = {
  back: "Espalda",
  biceps: "Bíceps",
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

function formatReps(min: number, max: number) {
  return min === max ? `${min}` : `${min}-${max}`;
}

function formatRest(seconds: number) {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}:${remainder.toString().padStart(2, "0")} min` : `${minutes} min`;
}

type WorkoutDetailProps = {
  templateId: string;
  name: string;
  days: string[];
};

function WorkoutTemplateDetail({ templateId, name, days }: WorkoutDetailProps) {
  const { data: exercises, isLoading, error } = useTemplateExercises(templateId);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b bg-[var(--surface-alt)] py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Dumbbell className="size-4 text-primary" />
              {name}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {days.join(" · ")}
            </CardDescription>
          </div>
          <Badge variant="secondary">{exercises?.length ?? "…"} ejercicios</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-3 sm:p-4">
        {isLoading && <Skeleton className="h-56 w-full rounded-xl" />}
        {error && <QueryError message="No pudimos cargar el detalle de esta rutina." />}
        {(exercises ?? []).map(item => {
          const exercise = item.exercise;
          if (!exercise) return null;

          return (
            <article
              key={item.id}
              className="grid overflow-hidden rounded-xl border border-[var(--border-strong)] bg-card sm:grid-cols-[11rem_1fr]"
            >
              <ExerciseVisual
                name={exercise.name}
                imageUrl={exercise.image_url}
                className="aspect-[16/9] min-h-36 sm:aspect-auto sm:min-h-48"
              />
              <div className="space-y-3 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {item.position}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold leading-tight">{exercise.name}</h4>
                      {item.is_warmup && (
                        <Badge variant="outline" className="text-warning">
                          <Flame className="size-3" /> Calentamiento
                        </Badge>
                      )}
                      {item.superset_with_position && (
                        <Badge variant="outline">Superset con #{item.superset_with_position}</Badge>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Dumbbell className="size-3.5" /> {item.prescribed_sets} series
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Repeat2 className="size-3.5" /> {formatReps(item.reps_min, item.reps_max)} reps
                      </span>
                      {item.target_rpe && (
                        <span className="flex items-center gap-1.5">
                          <Gauge className="size-3.5" /> RPE {item.target_rpe}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock3 className="size-3.5" /> {formatRest(item.rest_seconds)} descanso
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {exercise.muscle_groups.map(muscle => (
                    <span
                      key={muscle}
                      className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground"
                    >
                      {MUSCLE_NAMES[muscle] ?? muscle}
                    </span>
                  ))}
                </div>

                {item.notes && (
                  <p className="rounded-lg bg-[var(--accent-bg)] px-3 py-2 text-xs leading-relaxed">
                    <span className="font-semibold text-primary">Indicación: </span>
                    {item.notes}
                  </p>
                )}
                {exercise.technique && (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Técnica: </span>
                    {exercise.technique}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function PlanWeekView() {
  const { data: plan, isLoading: planLoading, error: planError } = useActivePlan();
  const { data: slots, isLoading: slotsLoading, error: slotsError } = usePlanSchedule(plan?.id);
  const todayDow = dayOfWeek(new Date());

  if (planLoading || slotsLoading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (planError || slotsError) return <QueryError message="No pudimos cargar tu plan semanal." />;
  if (!plan) return <DefaultPlanInstaller />;

  const ordered = [1, 2, 3, 4, 5, 6, 0].map(dow => {
    const slot = (slots ?? []).find(item => item.day_of_week === dow);
    return { dow, slot };
  });

  const workoutDays = ordered.filter(({ slot }) => slot?.template_id).length;
  const activityDays = ordered.filter(({ slot }) => slot && !slot.template_id && slot.activity_label && !slot.activity_label.toLowerCase().includes("descanso")).length;
  const workouts = new Map<string, WorkoutDetailProps>();

  ordered.forEach(({ dow, slot }) => {
    if (!slot?.template_id || !slot.template) return;
    const existing = workouts.get(slot.template_id);
    if (existing) {
      existing.days.push(DAY_NAMES_LONG[dow]);
      return;
    }
    workouts.set(slot.template_id, {
      templateId: slot.template_id,
      name: slot.template.name,
      days: [DAY_NAMES_LONG[dow]],
    });
  });

  return (
    <div className="space-y-6">
      <Card className="gap-0 py-0">
        <CardHeader className="bg-[var(--accent-bg)] py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Plan activo</p>
              <CardTitle className="mt-1 text-xl">{plan.name}</CardTitle>
              {plan.description && <CardDescription className="mt-2 leading-relaxed">{plan.description}</CardDescription>}
            </div>
            <Badge>Semana {plan.current_week} de {plan.mesocycle_weeks}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 py-4 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="flex items-center gap-2 font-semibold"><Dumbbell className="size-4 text-primary" /> Fuerza</p>
            <p className="mt-1 text-xs text-muted-foreground">{workoutDays} sesiones · {workouts.size} rutinas</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="flex items-center gap-2 font-semibold"><HeartPulse className="size-4 text-primary" /> Actividad</p>
            <p className="mt-1 text-xs text-muted-foreground">{activityDays} días complementarios</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="flex items-center gap-2 font-semibold"><CalendarDays className="size-4 text-primary" /> Mesociclo</p>
            <p className="mt-1 text-xs text-muted-foreground">{plan.mesocycle_weeks} semanas en total</p>
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="weekly-schedule-title">
        <h3 id="weekly-schedule-title" className="mb-3 text-sm font-semibold">Semana</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {ordered.map(({ dow, slot }) => {
            const isToday = dow === todayDow;
            const label = slot?.template?.name ?? slot?.activity_label ?? "Sin actividad";
            const hasWorkout = !!slot?.template_id;
            return (
              <div
                key={dow}
                className={cn(
                  "min-h-24 rounded-xl border p-3",
                  isToday
                    ? "border-primary bg-[var(--accent-bg)]"
                    : "border-[var(--border-strong)] bg-card",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("text-xs font-bold uppercase tracking-wide", isToday ? "text-primary" : "text-muted-foreground")}>{DAY_NAMES[dow]}</span>
                  {isToday && <span className="text-[10px] font-bold uppercase text-primary">Hoy</span>}
                </div>
                <p className={cn("mt-3 text-xs font-medium leading-snug", !hasWorkout && "text-muted-foreground")}>{label}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="strength-routines-title" className="space-y-4">
        <div>
          <h3 id="strength-routines-title" className="text-lg font-semibold">Detalle de las rutinas</h3>
          <p className="mt-1 text-sm text-muted-foreground">Prescripción, descanso, técnica e imagen de cada ejercicio.</p>
        </div>
        {[...workouts.values()].map(workout => (
          <WorkoutTemplateDetail key={workout.templateId} {...workout} />
        ))}
      </section>
    </div>
  );
}
