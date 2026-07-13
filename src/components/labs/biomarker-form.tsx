"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDateKey } from "@/lib/date";
import { useCreateBiomarkerResult, useUpdateBiomarkerResult } from "@/lib/labs/mutations";
import { biomarkerResultSchema, type BiomarkerResultFormValues } from "@/lib/labs/schemas";
import type { BiomarkerResult } from "@/lib/labs/types";
import { toast } from "sonner";

const COMMON_MARKERS = [
  "Glucosa",
  "HbA1c",
  "Colesterol total",
  "LDL",
  "HDL",
  "Triglicéridos",
  "Vitamina D",
  "Ferritina",
  "TSH",
  "Proteína C reactiva",
];

export function BiomarkerForm({ result, onDone }: { result?: BiomarkerResult; onDone: () => void }) {
  const [markerName, setMarkerName] = useState(result?.marker_name ?? "");
  const [value, setValue] = useState(String(result?.value ?? ""));
  const [unit, setUnit] = useState(result?.unit ?? "");
  const [referenceMin, setReferenceMin] = useState(String(result?.reference_min ?? ""));
  const [referenceMax, setReferenceMax] = useState(String(result?.reference_max ?? ""));
  const [measuredAt, setMeasuredAt] = useState(result?.measured_at ?? getDateKey());
  const [laboratory, setLaboratory] = useState(result?.laboratory ?? "");
  const [notes, setNotes] = useState(result?.notes ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const createMutation = useCreateBiomarkerResult();
  const updateMutation = useUpdateBiomarkerResult();
  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = biomarkerResultSchema.safeParse({
      marker_name: markerName,
      value,
      unit,
      reference_min: referenceMin,
      reference_max: referenceMax,
      measured_at: measuredAt,
      laboratory,
      notes,
    });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Revisa los valores");
      return;
    }

    const options = {
      onSuccess: () => {
        toast.success(result ? "Resultado actualizado" : "Resultado registrado");
        onDone();
      },
      onError: () => toast.error("No se pudo guardar el resultado"),
    };

    if (result) {
      updateMutation.mutate({ id: result.id, values: parsed.data as BiomarkerResultFormValues }, options);
    } else {
      createMutation.mutate(parsed.data as BiomarkerResultFormValues, options);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="marker-name">Biomarcador</Label>
        <Input
          id="marker-name"
          list="common-biomarkers"
          value={markerName}
          onChange={(event) => setMarkerName(event.target.value)}
          placeholder="Ej. Glucosa"
          autoFocus
        />
        <datalist id="common-biomarkers">
          {COMMON_MARKERS.map((marker) => <option key={marker} value={marker} />)}
        </datalist>
      </div>

      <div className="grid grid-cols-[1fr_0.8fr] gap-3">
        <TextField id="marker-value" label="Resultado" type="number" step="any" value={value} onChange={setValue} />
        <TextField id="marker-unit" label="Unidad" value={unit} onChange={setUnit} placeholder="mg/dL" />
      </div>

      <div>
        <p className="text-xs font-medium">Rango del reporte (opcional)</p>
        <div className="mt-1 grid grid-cols-2 gap-3">
          <TextField id="reference-min" label="Mínimo" type="number" step="any" value={referenceMin} onChange={setReferenceMin} />
          <TextField id="reference-max" label="Máximo" type="number" step="any" value={referenceMax} onChange={setReferenceMax} />
        </div>
      </div>

      <TextField id="measured-at" label="Fecha de medición" type="date" value={measuredAt} onChange={setMeasuredAt} />
      <TextField id="laboratory" label="Laboratorio (opcional)" value={laboratory} onChange={setLaboratory} />
      <TextField id="marker-notes" label="Notas (opcional)" value={notes} onChange={setNotes} />

      {formError && <p role="alert" className="text-xs text-destructive">{formError}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onDone}>Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={isPending || !markerName.trim()}>
          {isPending ? "Guardando..." : result ? "Guardar" : "Registrar"}
        </Button>
      </div>
    </form>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  step,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1"
      />
    </div>
  );
}
