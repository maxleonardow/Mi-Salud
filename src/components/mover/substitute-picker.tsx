"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Exercise = { id: string; name: string; muscle_groups: string[] };

type Props = {
  open: boolean;
  onClose: () => void;
  substituteIds: string[];
  onPick: (exercise: Exercise) => void;
};

export function SubstitutePicker({ open, onClose, substituteIds, onPick }: Props) {
  const [subs, setSubs] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || substituteIds.length === 0) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("exercises")
      .select("id, name, muscle_groups")
      .in("id", substituteIds)
      .then(({ data }) => {
        setSubs((data as Exercise[]) ?? []);
        setLoading(false);
      });
  }, [open, substituteIds]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sustituir ejercicio</DialogTitle>
        </DialogHeader>
        {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {!loading && subs.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay sustitutos definidos.</p>
        )}
        {!loading && subs.length > 0 && (
          <div className="space-y-2">
            {subs.map(s => (
              <Button
                key={s.id}
                variant="outline"
                className="w-full justify-start h-auto py-3 flex flex-col items-start"
                onClick={() => { onPick(s); onClose(); }}
              >
                <span className="font-semibold">{s.name}</span>
                <span className="text-xs text-muted-foreground">{s.muscle_groups.join(", ")}</span>
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
