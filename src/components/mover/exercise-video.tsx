"use client";

import Image from "next/image";
import { ExternalLink, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ExerciseVideoMedia } from "@/lib/mover/exercise-media";

type Props = {
  name: string;
  media: ExerciseVideoMedia;
  animate: boolean;
  className?: string;
};

export function ExerciseVideo({ name, media, animate, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!animate || !videoRef.current) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    void videoRef.current.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [animate, media.src]);

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      await video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }

  return (
    <figure
      aria-label={`Demostración filmada de ${name}`}
      className={cn("group relative overflow-hidden bg-black", className)}
    >
      {animate && !hasError ? (
        <video
          ref={videoRef}
          src={media.src}
          poster={media.poster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={`Video de técnica: ${name}`}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setHasError(true)}
          className={cn(
            "h-full w-full",
            media.objectFit === "contain" ? "object-contain" : "object-cover",
          )}
        />
      ) : (
        <Image
          src={media.poster}
          alt={`Demostración real de ${name}`}
          fill
          sizes="(max-width: 640px) 100vw, 176px"
          className={media.objectFit === "contain" ? "object-contain" : "object-cover"}
        />
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-3 pt-12 text-white">
        <div className="flex min-w-0 items-center gap-2">
          {animate && !hasError && (
            <button
              type="button"
              onClick={() => void togglePlayback()}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/95 text-black shadow-sm transition hover:scale-105"
              aria-label={isPlaying ? "Pausar demostración" : "Reproducir demostración"}
            >
              {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
            </button>
          )}
          <span className="truncate text-[11px] font-semibold uppercase tracking-[0.08em]">
            {media.kind === "video" ? "Video real" : "Foto real"}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 text-[10px] text-white/85">
          <a
            href={media.attribution.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline decoration-white/40 underline-offset-2 hover:text-white"
          >
            {media.attribution.label}
            <ExternalLink className="size-2.5" aria-hidden="true" />
          </a>
          {media.attribution.licenseLabel && media.attribution.licenseUrl && (
            <a
              href={media.attribution.licenseUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden underline decoration-white/40 underline-offset-2 hover:text-white sm:inline"
            >
              {media.attribution.licenseLabel}
            </a>
          )}
        </div>
      </div>
    </figure>
  );
}
