"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession, useSessionSetLogs } from "@/lib/mover/queries";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDateKey } from "@/lib/date";

const supabase = createClient();

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: session, isLoading: sLoading } = useSession(params.id);
  const { data: logs, isLoading: lLoading } = useSessionSetLogs(params.id);

  if (sLoading || lLoading) return <Skeleton className="h-96 w-full" />;
  if (!session) return <p>Sesión no encontrada.</p>;

  const dateStr = formatDateKey(session.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Group logs by exercise_id preserving order of appearance
  const exerciseOrder: string[] = [];
  const grouped: Record<string, NonNullable<typeof logs>> = {};
  for (const l of logs ?? []) {
    if (!grouped[l.exercise_id]) {
      grouped[l.exercise_id] = [];
      exerciseOrder.push(l.exercise_id);
    }
    grouped[l.exercise_id]!.push(l);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const templateName = (session as any)?.template?.name ?? "Sesión libre";

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <Link href="/mover" className="text-xs text-muted-foreground hover:text-foreground">← Volver</Link>
        <h1 className="text-2xl font-bold tracking-tight mt-1">{templateName}</h1>
        <p className="text-sm text-muted-foreground capitalize">
          {dateStr} · {session.duration_min ? `${session.duration_min} min` : "duración desconocida"} · {session.status}
        </p>
      </div>

      {(logs ?? []).length === 0 && <p className="text-sm text-muted-foreground">Sin sets registrados.</p>}

      {exerciseOrder.map(exId => (
        <ExerciseSetsBlock key={exId} exerciseId={exId} sets={grouped[exId] ?? []} />
      ))}

      {session.status === "in_progress" && (
        <Link href={`/mover/session/${session.id}`}>
          <Button className="w-full">Continuar sesión</Button>
        </Link>
      )}
    </div>
  );
}

type SetLog = {
  id: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  is_pr: boolean;
};

function ExerciseSetsBlock({ exerciseId, sets }: { exerciseId: string; sets: SetLog[] }) {
  return (
    <div className="rounded-xl border border-[var(--border-strong)] bg-white p-4">
      <ExerciseName exerciseId={exerciseId} />
      <table className="w-full mt-3 text-sm">
        <thead className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
          <tr>
            <th className="text-left pb-1">#</th>
            <th className="text-left pb-1">Peso</th>
            <th className="text-left pb-1">Reps</th>
            <th className="text-left pb-1">RPE</th>
            <th className="text-right pb-1"></th>
          </tr>
        </thead>
        <tbody>
          {sets.map(s => (
            <tr key={s.id} className="border-t border-[var(--border-strong)]">
              <td className="py-1.5 font-semibold">{s.set_number}</td>
              <td className="py-1.5">{s.weight_kg ?? "—"} kg</td>
              <td className="py-1.5">{s.reps ?? "—"}</td>
              <td className="py-1.5">{s.rpe ?? "—"}</td>
              <td className="py-1.5 text-right">{s.is_pr && "🏆"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExerciseName({ exerciseId }: { exerciseId: string }) {
  const { data } = useQuery({
    queryKey: ["exerciseName", exerciseId],
    queryFn: async () => {
      const { data } = await supabase.from("exercises").select("name").eq("id", exerciseId).single();
      return data?.name ?? "Ejercicio";
    },
  });
  return <h3 className="font-semibold">{data ?? "..."}</h3>;
}
