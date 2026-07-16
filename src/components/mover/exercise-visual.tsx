import Image from "next/image";
import { cn } from "@/lib/utils";
import { ExerciseImagePlaceholder } from "@/components/mover/exercise-image-placeholder";
import { ExerciseVideo } from "@/components/mover/exercise-video";
import { getExerciseMedia } from "@/lib/mover/exercise-media";

const EXERCISE_IMAGES: Record<string, string> = {
  "Goblet Squat": "/images/exercises/goblet-squat.webp",
  "Sentadilla con Barra": "/images/exercises/barbell-back-squat.webp",
  "Press Banca con Mancuernas": "/images/exercises/dumbbell-bench-press.webp",
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
  animate?: boolean;
  className?: string;
};

export function ExerciseVisual({ name, imageUrl, animate = true, className }: Props) {
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

  const media = getExerciseMedia(name);
  if (media?.kind === "video") {
    return (
      <ExerciseVideo
        name={name}
        media={media}
        animate={animate}
        className={className}
      />
    );
  }

  if (media?.kind === "photo") {
    return (
      <figure className={cn("relative overflow-hidden bg-black", className)}>
        <Image
          src={media.src}
          alt={`Fotografía real de ${name}`}
          fill
          sizes="(max-width: 640px) 100vw, 176px"
          style={{ objectPosition: media.objectPosition }}
          className="object-cover"
        />
        <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/85 to-transparent p-3 pt-12 text-[10px] text-white">
          <span className="font-semibold uppercase tracking-[0.08em]">Foto real</span>
          <a
            href={media.attribution.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="truncate underline decoration-white/40 underline-offset-2"
          >
            {media.attribution.label}
          </a>
        </figcaption>
      </figure>
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
