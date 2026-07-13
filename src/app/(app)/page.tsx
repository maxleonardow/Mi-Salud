import { ModuleHeader } from "@/components/layout/module-header";
import { TodayBanner } from "@/components/mover/today-banner";
import { DailyChecklist } from "@/components/suplementos/daily-checklist";
import { HabitsChecklist } from "@/components/habitos/habits-checklist";
import { formatAppDate } from "@/lib/date";
import { connection } from "next/server";

export default async function HoyPage() {
  await connection();
  const today = formatAppDate(new Date(), {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <>
      <ModuleHeader title="Hoy" meta={today} />

      <div className="space-y-8">
        {/* Ejercicio */}
        <section>
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
            Ejercicio
          </p>
          <TodayBanner />
        </section>

        {/* Suplementos */}
        <section>
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
            Suplementos
          </p>
          <DailyChecklist />
        </section>

        {/* Hábitos */}
        <section>
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
            Hábitos
          </p>
          <HabitsChecklist />
        </section>
      </div>
    </>
  );
}
