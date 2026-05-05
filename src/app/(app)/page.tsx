import { ModuleHeader } from "@/components/layout/module-header";

export default function HoyPage() {
  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long",
  });
  return (
    <>
      <ModuleHeader title="Hoy" meta={today} />
      <p className="text-sm text-muted-foreground">Próximamente.</p>
    </>
  );
}
