"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type Props = {
  setNumber: number;
  initialWeight?: number | null;
  initialReps?: number | null;
  initialRpe?: number | null;
  saved?: boolean;
  isPr?: boolean;
  pending?: boolean;
  onSave: (vals: { weight: number | null; reps: number | null; rpe: number | null }) => void;
  onDelete?: () => void;
};

export function SetInputRow({ setNumber, initialWeight, initialReps, initialRpe, saved, isPr, pending, onSave, onDelete }: Props) {
  const [weight, setWeight] = useState<string>(initialWeight?.toString() ?? "");
  const [reps, setReps] = useState<string>(initialReps?.toString() ?? "");
  const [rpe, setRpe] = useState<string>(initialRpe?.toString() ?? "");

  function handleSave() {
    onSave({
      weight: weight === "" ? null : Number(weight),
      reps: reps === "" ? null : Number(reps),
      rpe: rpe === "" ? null : Number(rpe),
    });
  }

  return (
    <div className={`grid grid-cols-[40px_1fr_1fr_1fr_auto] items-center gap-2 py-2 px-2 rounded-md ${saved ? "bg-[var(--surface-alt)]" : ""}`}>
      <span className="text-sm font-bold text-muted-foreground">{setNumber}</span>
      <Input
        type="number"
        inputMode="decimal"
        placeholder="kg"
        value={weight}
        onChange={e => setWeight(e.target.value)}
        disabled={saved}
        className="h-9 text-sm"
      />
      <Input
        type="number"
        inputMode="numeric"
        placeholder="reps"
        value={reps}
        onChange={e => setReps(e.target.value)}
        disabled={saved}
        className="h-9 text-sm"
      />
      <Input
        type="number"
        inputMode="numeric"
        placeholder="RPE"
        value={rpe}
        onChange={e => setRpe(e.target.value)}
        disabled={saved}
        min={1}
        max={10}
        className="h-9 text-sm"
      />
      {!saved ? (
        <Button size="sm" onClick={handleSave} disabled={pending}>
          {pending ? "..." : "✓"}
        </Button>
      ) : (
        <div className="flex items-center gap-1">
          {isPr && <span title="Personal Record" className="text-base">🏆</span>}
          {onDelete && (
            <Button size="sm" variant="ghost" onClick={onDelete}>
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
