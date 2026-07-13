"use client";

import Link from "next/link";
import { useRecentSessions } from "@/lib/mover/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/ui/query-error";
import { formatDateKey } from "@/lib/date";

export function SessionList() {
  const { data, isLoading, error } = useRecentSessions(50);

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (error) return <QueryError message="No pudimos cargar tu historial." />;
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay sesiones registradas.</p>;
  }

  return (
    <div className="space-y-2">
      {data.map(s => {
        const dateStr = formatDateKey(s.date, { weekday: "short", day: "numeric", month: "short" });
        const statusBadge =
          s.status === "completed" ? "✓" : s.status === "in_progress" ? "⏱" : s.status === "skipped" ? "⤫" : "•";
        return (
          <Link
            key={s.id}
            href={`/mover/history/${s.id}`}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border-strong)] bg-white hover:bg-[var(--surface-alt)]"
          >
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground w-20">{dateStr}</span>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <span className="flex-1 text-sm font-medium">{(s as any).template?.name ?? "Sesión libre"}</span>
            <span className="text-xs text-muted-foreground">{s.duration_min ? `${s.duration_min}m` : "—"}</span>
            <span className="text-sm">{statusBadge}</span>
          </Link>
        );
      })}
    </div>
  );
}
