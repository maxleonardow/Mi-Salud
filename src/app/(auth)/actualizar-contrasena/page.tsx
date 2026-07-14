"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "../login/actions";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await updatePassword(formData);
    setPending(false);
    if ("error" in result && result.error) setError(result.error);
    else if ("success" in result) {
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Define tu contraseña
        </h1>
        <p className="text-sm text-muted-foreground">
          Usa al menos 10 caracteres. Al guardarla entrarás directamente a Mi
          Salud.
        </p>
      </div>
      <form action={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nueva contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmation">Confirma la contraseña</Label>
          <Input
            id="confirmation"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" aria-live="polite">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Guardando..." : "Guardar contraseña"}
        </Button>
      </form>
    </div>
  );
}
