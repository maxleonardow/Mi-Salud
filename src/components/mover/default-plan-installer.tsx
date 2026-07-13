"use client";

import { Dumbbell, HeartPulse } from "lucide-react";
import { toast } from "sonner";
import { useInstallDefaultWorkoutPlan } from "@/lib/mover/mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DefaultPlanInstaller() {
  const installPlan = useInstallDefaultWorkoutPlan();

  async function handleInstall() {
    try {
      await installPlan.mutateAsync();
      toast.success("Plan semanal instalado");
    } catch {
      toast.error("No pudimos instalar el plan");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="size-4 text-primary" />
          Plan base A/B
        </CardTitle>
        <CardDescription>
          Dos sesiones de fuerza de aproximadamente 45 minutos y tres bloques de Zona 2 que suman 150 minutos semanales.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="font-medium">Fuerza</p>
            <p className="mt-1 text-xs text-muted-foreground">Lunes A · Jueves B · cuerpo completo</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="flex items-center gap-1.5 font-medium">
              <HeartPulse className="size-3.5" /> Zona 2
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Martes 45 · Viernes 45 · Sábado 60 min</p>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Es una base general y editable. Empieza con cargas conservadoras y detente ante dolor, mareo o síntomas inusuales.
        </p>
        <Button className="w-full" onClick={handleInstall} disabled={installPlan.isPending}>
          {installPlan.isPending ? "Instalando..." : "Instalar plan recomendado"}
        </Button>
      </CardContent>
    </Card>
  );
}
