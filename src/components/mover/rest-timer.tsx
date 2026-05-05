"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  durationSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
};

export function RestTimer({ durationSeconds, onComplete, autoStart = false }: Props) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [running, setRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRunning(false);
          onComplete?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, onComplete]);

  useEffect(() => {
    setRemaining(durationSeconds);
  }, [durationSeconds]);

  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-3 rounded-lg bg-[var(--accent-bg)] p-3">
      <span className="font-mono text-2xl font-bold text-primary tabular-nums">{mm}:{ss}</span>
      <div className="flex gap-2 ml-auto">
        {!running ? (
          <Button size="sm" onClick={() => setRunning(true)} disabled={remaining === 0}>Iniciar</Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setRunning(false)}>Pausar</Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => { setRemaining(durationSeconds); setRunning(false); }}>Reset</Button>
      </div>
    </div>
  );
}
