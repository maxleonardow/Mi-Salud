import { AlertCircle } from "lucide-react";

type QueryErrorProps = {
  message?: string;
};

export function QueryError({
  message = "No pudimos cargar esta información. Intenta de nuevo en unos momentos.",
}: QueryErrorProps) {
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div>
        <p className="font-medium">Ocurrió un problema</p>
        <p className="mt-0.5 text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
