"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Laptop, LockKeyhole, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QueryError } from "@/components/ui/query-error";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_TIME_ZONE } from "@/lib/date";
import { useSaveProfileSettings } from "@/lib/ajustes/mutations";
import { useAccountSettings } from "@/lib/ajustes/queries";
import type { UnitsPreference } from "@/lib/ajustes/types";
import { toast } from "sonner";

export function SettingsPanel() {
  const { data, isLoading, error } = useAccountSettings();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    );
  }
  if (error || !data) return <QueryError message="No pudimos cargar los ajustes de tu cuenta." />;

  return (
    <div className="max-w-2xl space-y-4">
      <ProfileCard account={data} />
      <AppearanceCard />
      <SecurityCard email={data.email} />
    </div>
  );
}

function ProfileCard({ account }: { account: NonNullable<ReturnType<typeof useAccountSettings>["data"]> }) {
  const [displayName, setDisplayName] = useState(account.profile?.display_name ?? "");
  const [birthdate, setBirthdate] = useState(account.profile?.birthdate ?? "");
  const [unitsPreference, setUnitsPreference] = useState<UnitsPreference>(account.profile?.units_pref ?? "metric");
  const saveMutation = useSaveProfileSettings();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    saveMutation.mutate(
      { displayName, birthdate, unitsPreference },
      {
        onSuccess: () => toast.success("Perfil actualizado"),
        onError: () => toast.error("No se pudo actualizar el perfil"),
      }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="display-name">Nombre</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Tu nombre"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="birthdate">Fecha de nacimiento</Label>
            <Input
              id="birthdate"
              type="date"
              value={birthdate}
              onChange={(event) => setBirthdate(event.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Unidades</Label>
            <Select value={unitsPreference} onValueChange={(value) => setUnitsPreference(value as UnitsPreference)}>
              <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Métricas (kg, cm)</SelectItem>
                <SelectItem value="imperial">Imperiales (lb, in)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            Zona horaria operativa: <span className="font-medium text-foreground">{APP_TIME_ZONE}</span>
          </div>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Guardando..." : "Guardar perfil"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const options = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Oscuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Laptop },
  ];

  return (
    <Card>
      <CardHeader><CardTitle>Apariencia</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {options.map((option) => {
            const Icon = option.icon;
            const active = mounted && theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-xs font-medium transition-colors ${
                  active ? "border-primary bg-[var(--accent-bg)] text-primary" : "hover:bg-muted/50"
                }`}
              >
                <Icon className="size-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function SecurityCard({ email }: { email: string | null }) {
  return (
    <Card>
      <CardHeader><CardTitle>Cuenta y seguridad</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border bg-emerald-50/60 p-3 dark:bg-emerald-950/20">
          <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
          <div>
            <p className="text-sm font-medium">Sesión protegida</p>
            <p className="text-xs text-muted-foreground">Magic link, cuenta existente y datos aislados mediante RLS.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LockKeyhole className="size-4 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="truncate text-sm font-medium">{email ?? "No disponible"}</p>
          </div>
        </div>
        <form action="/auth/sign-out" method="post">
          <Button type="submit" variant="outline">
            <LogOut className="size-4" /> Cerrar sesión
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
