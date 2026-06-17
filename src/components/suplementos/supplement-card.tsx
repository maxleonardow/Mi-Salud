"use client";

import {
  Pill,
  Leaf,
  Fish,
  Atom,
  FlaskConical,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Supplement, SupplementCategory } from "@/lib/suplementos/types";
import {
  FORM_LABELS,
  CATEGORY_LABELS,
} from "@/lib/suplementos/types";

const CATEGORY_ICONS: Record<SupplementCategory, LucideIcon> = {
  vitamina: Sparkles,
  mineral: Atom,
  aminoacido: FlaskConical,
  herb: Leaf,
  probiotico: Pill,
  omega: Fish,
  otro: Pill,
};

const CATEGORY_COLORS: Record<SupplementCategory, string> = {
  vitamina: "text-amber-600 bg-amber-50",
  mineral: "text-slate-600 bg-slate-50",
  aminoacido: "text-violet-600 bg-violet-50",
  herb: "text-emerald-600 bg-emerald-50",
  probiotico: "text-sky-600 bg-sky-50",
  omega: "text-blue-600 bg-blue-50",
  otro: "text-gray-600 bg-gray-50",
};

type Props = {
  supplement: Supplement;
  onEdit?: () => void;
  onToggle?: (active: boolean) => void;
  compact?: boolean;
};

export function SupplementCard({ supplement, onEdit, onToggle, compact }: Props) {
  const Icon = CATEGORY_ICONS[supplement.category];
  const colorClass = CATEGORY_COLORS[supplement.category];

  if (compact) {
    return (
      <div
        className="flex items-center gap-2.5 py-1.5 cursor-pointer"
        onClick={onEdit}
      >
        <div className={`flex size-7 items-center justify-center rounded-md ${colorClass}`}>
          <Icon className="size-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{supplement.name}</p>
          <p className="text-xs text-muted-foreground">
            {supplement.dose_amount} {supplement.dose_unit}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card
      size="sm"
      className={`cursor-pointer transition-opacity ${!supplement.active ? "opacity-50" : ""}`}
      onClick={onEdit}
    >
      <CardContent className="flex items-start gap-3">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
          <Icon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{supplement.name}</p>
            {!supplement.active && (
              <Badge variant="secondary" className="text-[10px]">Inactivo</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {supplement.dose_amount} {supplement.dose_unit} · {FORM_LABELS[supplement.form]}
            {supplement.brand ? ` · ${supplement.brand}` : ""}
          </p>
          <div className="mt-1.5">
            <Badge variant="outline" className="text-[10px]">
              {CATEGORY_LABELS[supplement.category]}
            </Badge>
          </div>
        </div>
        {onToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(!supplement.active);
            }}
            className={`mt-1 size-5 rounded-full border-2 transition-colors ${
              supplement.active
                ? "border-emerald-500 bg-emerald-500"
                : "border-muted-foreground/30"
            }`}
            aria-label={supplement.active ? "Desactivar" : "Activar"}
          />
        )}
      </CardContent>
    </Card>
  );
}

export { CATEGORY_ICONS, CATEGORY_COLORS };
