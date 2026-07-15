"use client";

import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useInstallPersonalizedWorkoutPlan } from "@/lib/mover/mutations";

export function PersonalizedPlanUpgrade() {
  const installPlan = useInstallPersonalizedWorkoutPlan();

  async function handleUpgrade() {
    try {
      await installPlan.mutateAsync(true);
      toast.success("Tu plan personalizado ya está activo");
    } catch {
      toast.error("No pudimos activar el plan personalizado");
    }
  }

  return (
    <Card className="border-primary/40 bg-[var(--accent-bg)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <RefreshCw className="size-4 text-primary" />
          Tu nueva calibración está lista
        </CardTitle>
        <CardDescription>
          Activa el programa de 12 semanas con tres días de fuerza, énfasis en piernas, versión de 20 minutos y alternativas por ejercicio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleUpgrade} disabled={installPlan.isPending}>
          {installPlan.isPending ? "Activando..." : "Activar plan personalizado"}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Tus sesiones e historial anteriores se conservan.
        </p>
      </CardContent>
    </Card>
  );
}
