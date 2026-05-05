"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, useSessionSetLogs, useTemplateExercises } from "@/lib/mover/queries";
import { useLogSet, useCompleteSession, useDeleteSet } from "@/lib/mover/mutations";
import { Button } from "@/components/ui/button";
import { ExerciseImagePlaceholder } from "@/components/mover/exercise-image-placeholder";
import { SetInputRow } from "@/components/mover/set-input-row";
import { RestTimer } from "@/components/mover/rest-timer";
import { SubstitutePicker } from "@/components/mover/substitute-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function SessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = params.id;

  const { data: session, isLoading: sLoading } = useSession(sessionId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const templateId = (session as any)?.template_id ?? undefined;
  const { data: prescribed, isLoading: pLoading } = useTemplateExercises(templateId);
  const { data: setLogs } = useSessionSetLogs(sessionId);

  const logSet = useLogSet();
  const deleteSet = useDeleteSet();
  const completeSession = useCompleteSession();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [substitutes, setSubstitutes] = useState<Record<string, { id: string; name: string }>>({});
  const [pickerOpen, setPickerOpen] = useState(false);

  if (sLoading || pLoading) return <Skeleton className="h-96 w-full" />;
  if (!session) return <p>Sesión no encontrada.</p>;
  if (!prescribed || prescribed.length === 0) return <p>No hay ejercicios prescritos.</p>;

  const current = prescribed[currentIdx];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentExerciseObj = (current as any).exercise as { id: string; name: string; substitute_ids: string[]; technique: string | null } | undefined;
  const exerciseToUse = substitutes[current.id]
    ? { id: substitutes[current.id].id, name: substitutes[current.id].name }
    : { id: currentExerciseObj?.id ?? "", name: currentExerciseObj?.name ?? "" };

  const setsForCurrent = (setLogs ?? []).filter(s => s.exercise_id === exerciseToUse.id);
  const setsDone = setsForCurrent.length;
  const setsRemaining = current.prescribed_sets - setsDone;

  async function handleSaveSet(vals: { weight: number | null; reps: number | null; rpe: number | null }) {
    const result = await logSet.mutateAsync({
      sessionId,
      exerciseId: exerciseToUse.id,
      setNumber: setsDone + 1,
      weightKg: vals.weight,
      reps: vals.reps,
      rpe: vals.rpe,
    });
    if (result.is_pr) toast.success("🏆 Personal Record!");
  }

  async function handleFinish() {
    await completeSession.mutateAsync({ sessionId });
    toast.success("Sesión completada");
    router.push("/mover");
  }

  function nextExercise() {
    if (currentIdx < prescribed!.length - 1) setCurrentIdx(i => i + 1);
  }
  function prevExercise() {
    if (currentIdx > 0) setCurrentIdx(i => i - 1);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
            Ejercicio {currentIdx + 1} de {prescribed.length}
          </p>
          <h1 className="text-xl font-bold tracking-tight">{exerciseToUse.name}</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPickerOpen(true)}
          disabled={!currentExerciseObj?.substitute_ids?.length}
        >
          Sustituir
        </Button>
      </div>

      {/* Exercise card */}
      <div className="flex gap-4 items-start rounded-xl border border-[var(--border-strong)] bg-white p-4">
        <ExerciseImagePlaceholder name={exerciseToUse.name} size={96} />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-base">
            {current.prescribed_sets} sets × {current.reps_min === current.reps_max ? current.reps_min : `${current.reps_min}-${current.reps_max}`} reps
          </p>
          {current.target_rpe && <p className="text-muted-foreground">RPE objetivo: {current.target_rpe}</p>}
          {current.notes && <p className="text-muted-foreground mt-1">{current.notes}</p>}
          {currentExerciseObj?.technique && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{currentExerciseObj.technique}</p>}
        </div>
      </div>

      {/* Sets */}
      <div className="rounded-xl border border-[var(--border-strong)] bg-white p-3">
        <div className="grid grid-cols-[40px_1fr_1fr_1fr_auto] items-center gap-2 px-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>#</span><span>Peso</span><span>Reps</span><span>RPE</span><span></span>
        </div>
        {setsForCurrent.map(s => (
          <SetInputRow
            key={s.id}
            setNumber={s.set_number}
            initialWeight={s.weight_kg}
            initialReps={s.reps}
            initialRpe={s.rpe}
            saved
            isPr={s.is_pr}
            onSave={() => {}}
            onDelete={() => deleteSet.mutate({ setId: s.id, sessionId })}
          />
        ))}
        {setsRemaining > 0 && (
          <SetInputRow
            key={`new-${setsDone}`}
            setNumber={setsDone + 1}
            pending={logSet.isPending}
            onSave={handleSaveSet}
          />
        )}
      </div>

      {/* Rest timer */}
      {current.rest_seconds > 0 && setsDone > 0 && setsRemaining > 0 && (
        <RestTimer durationSeconds={current.rest_seconds} autoStart />
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={prevExercise} disabled={currentIdx === 0} className="flex-1">
          ← Anterior
        </Button>
        {currentIdx < prescribed.length - 1 ? (
          <Button onClick={nextExercise} className="flex-1">Siguiente →</Button>
        ) : (
          <Button onClick={handleFinish} className="flex-1" disabled={completeSession.isPending}>
            {completeSession.isPending ? "..." : "Terminar 🏁"}
          </Button>
        )}
      </div>

      <SubstitutePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        substituteIds={currentExerciseObj?.substitute_ids ?? []}
        onPick={(ex) => setSubstitutes(s => ({ ...s, [current.id]: ex }))}
      />
    </div>
  );
}
