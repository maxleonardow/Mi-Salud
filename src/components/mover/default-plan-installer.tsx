"use client";

import { Dumbbell, HeartPulse, Repeat2 } from "lucide-react";
import { toast } from "sonner";
import { useInstallPersonalizedWorkoutPlan } from "@/lib/mover/mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DefaultPlanInstaller() {
  const installPlan = useInstallPersonalizedWorkoutPlan();

  async function handleInstall() {
    try {
      await installPlan.mutateAsync(false);
      toast.success("Plan personalizado instalado");
    } catch {
      toast.error("No pudimos instalar el plan");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="size-4 text-primary" />
          Plan atlético de 12 semanas
        </CardTitle>
        <CardDescription>
          Tres sesiones de fuerza de 45 minutos, con versión esencial de 20 minutos, énfasis en piernas y tenis opcional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="font-medium">Fuerza</p>
            <p className="mt-1 text-xs text-muted-foreground">Lunes · miércoles · viernes</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="flex items-center gap-1.5 font-medium">
              <HeartPulse className="size-3.5" /> Tenis
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Martes y/o jueves · 60 min</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="flex items-center gap-1.5 font-medium">
              <Repeat2 className="size-3.5" /> Alternativas
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Una o más por ejercicio</p>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Empieza con cargas conservadoras, hidrátate antes de entrenar y detente ante dolor, mareo o síntomas inusuales.
        </p>
        <Button className="w-full" onClick={handleInstall} disabled={installPlan.isPending}>
          {installPlan.isPending ? "Instalando..." : "Instalar mi plan de 12 semanas"}
        </Button>
      </CardContent>
    </Card>
  );
}
