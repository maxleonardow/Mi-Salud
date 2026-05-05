"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail } from "./actions";

export default function LoginPage() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await signInWithEmail(formData);
    setPending(false);
    if ("error" in result && result.error) setError(result.error);
    else if ("success" in result) setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Revisa tu email</h1>
        <p className="text-sm text-muted-foreground">
          Te mandamos un link para entrar. Ábrelo en este dispositivo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Mi Salud</h1>
        <p className="text-sm text-muted-foreground">
          Entra con tu email — te mandamos un magic link.
        </p>
      </div>
      <form action={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Enviando..." : "Mandar magic link"}
        </Button>
      </form>
    </div>
  );
}
