import Image from "next/image";
import { cn } from "@/lib/utils";
import { ExerciseImagePlaceholder } from "@/components/mover/exercise-image-placeholder";

const EXERCISE_IMAGES: Record<string, string> = {
  "Goblet Squat": "/images/exercises/goblet-squat.webp",
  "Sentadilla con Barra": "/images/exercises/barbell-back-squat.webp",
  "Press Banca con Mancuernas": "/images/exercises/dumbbell-bench-press.webp",
  "Remo con Mancuerna 1 Brazo": "/images/exercises/one-arm-dumbbell-row.webp",
  "Press Militar Mancuernas Sentado": "/images/exercises/seated-dumbbell-overhead-press.webp",
  "Face Pull": "/images/exercises/face-pull.webp",
  "Curl Mancuernas Alternados": "/images/exercises/alternating-dumbbell-curl.webp",
  "Romanian Deadlift (RDL)": "/images/exercises/romanian-deadlift.webp",
  "Peso Muerto Convencional": "/images/exercises/conventional-deadlift.webp",
  "Press Banca Inclinado Mancuernas": "/images/exercises/incline-dumbbell-bench-press.webp",
  "Jalón al Pecho (Lat Pulldown)": "/images/exercises/lat-pulldown.webp",
  "Hip Thrust con Mancuerna": "/images/exercises/dumbbell-hip-thrust.webp",
  "Lateral Raise con Mancuernas": "/images/exercises/dumbbell-lateral-raise.webp",
  "Tríceps Push-down Cable": "/images/exercises/cable-triceps-pushdown.webp",
};

type Props = {
  name: string;
  imageUrl?: string | null;
  className?: string;
};

export function ExerciseVisual({ name, imageUrl, className }: Props) {
  if (imageUrl) {
    return (
      // Exercise URLs can be user-managed and are not limited to a fixed remote host.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={`Demostración de ${name}`}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  const localImage = EXERCISE_IMAGES[name];
  if (localImage) {
    return (
      <div
        className={cn("relative overflow-hidden bg-[#eef3ff]", className)}
      >
        <Image
          src={localImage}
          alt={`Demostración de ${name}`}
          fill
          sizes="(max-width: 640px) 100vw, 176px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center bg-[var(--surface-alt)]", className)}>
      <ExerciseImagePlaceholder name={name} size={88} />
    </div>
  );
}
