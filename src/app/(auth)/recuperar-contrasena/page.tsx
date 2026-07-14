"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "../login/actions";

export default function RecoverPasswordPage() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await requestPasswordReset(formData);
    setPending(false);
    if ("error" in result && result.error) setError(result.error);
    else if ("success" in result) setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Revisa tu email</h1>
        <p className="text-sm text-muted-foreground">
          Abre el enlace en este mismo navegador y perfil para establecer tu
          contraseña.
        </p>
        <Link className="text-sm underline underline-offset-4" href="/login">
          Volver al acceso
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Crear o recuperar contraseña
        </h1>
        <p className="text-sm text-muted-foreground">
          Te enviaremos un único enlace para definir una nueva contraseña.
        </p>
      </div>
      <form action={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" aria-live="polite">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Enviando..." : "Enviar recuperación"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Link className="underline underline-offset-4" href="/login">
          Volver al acceso
        </Link>
      </p>
    </div>
  );
}
