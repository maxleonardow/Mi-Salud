import { type ReactNode } from "react";

type Props = {
  title: string;
  meta?: string;
  action?: ReactNode;
};

export function ModuleHeader({ title, meta, action }: Props) {
  return (
    <div className="flex items-baseline justify-between mb-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {meta && <p className="text-xs text-muted-foreground mt-0.5 font-medium">{meta}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
