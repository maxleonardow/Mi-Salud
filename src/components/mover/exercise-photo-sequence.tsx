import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExercisePhotoSequence as PhotoSequence } from "@/lib/mover/exercise-media";

type Props = {
  name: string;
  sequence: PhotoSequence;
  className?: string;
};

export function ExercisePhotoSequence({ name, sequence, className }: Props) {
  return (
    <figure
      role="img"
      aria-label={`Secuencia fotográfica animada de ${name}: posición inicial y final`}
      className={cn("relative overflow-hidden bg-[#ecf3fa]", className)}
    >
      <Image
        src={sequence.start}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, 176px"
        className="exercise-photo-frame exercise-photo-frame-start object-cover"
      />
      <Image
        src={sequence.end}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, 176px"
        className="exercise-photo-frame exercise-photo-frame-end object-cover"
      />

      <figcaption className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-white/70 bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white shadow-sm backdrop-blur-sm">
        <Play className="size-3 fill-current" aria-hidden="true" />
        Guía fotográfica
      </figcaption>
      <div className="exercise-photo-progress absolute bottom-0 left-0 z-10 h-1 bg-primary" aria-hidden="true" />
    </figure>
  );
}
