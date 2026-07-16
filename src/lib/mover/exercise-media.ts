export type ExerciseAttribution = {
  label: string;
  sourceUrl: string;
  licenseLabel?: string;
  licenseUrl?: string;
};

export type ExerciseVideoMedia = {
  kind: "video";
  src: string;
  poster: string;
  objectFit?: "cover" | "contain";
  attribution: ExerciseAttribution;
};

export type ExercisePhotoMedia = {
  kind: "photo";
  src: string;
  objectPosition?: string;
  attribution: ExerciseAttribution;
};

export type ExerciseMedia = ExerciseVideoMedia | ExercisePhotoMedia;

const WGER_LICENSE_URL = "https://creativecommons.org/licenses/by-sa/4.0/";

function wgerVideo(slug: string, exerciseId: number): ExerciseVideoMedia {
  return {
    kind: "video",
    src: `/videos/exercises/${slug}.m4v`,
    poster: `/images/exercises/video-posters/${slug}.webp`,
    attribution: {
      label: "Goulart · wger",
      sourceUrl: `https://wger.de/api/v2/exerciseinfo/${exerciseId}/`,
      licenseLabel: "CC BY-SA 4.0",
      licenseUrl: WGER_LICENSE_URL,
    },
  };
}

export const EXERCISE_MEDIA: Record<string, ExerciseMedia> = {
  "Prensa de Piernas": wgerVideo("leg-press", 371),
  "Sentadilla Búlgara con Mancuernas": {
    kind: "video",
    src: "/videos/exercises/bulgarian-split-squat.m4v",
    poster: "/images/exercises/video-posters/bulgarian-split-squat.webp",
    attribution: {
      label: "U.S. Marine Corps · DVIDS",
      sourceUrl: "https://www.dvidshub.net/video/517507/dumbbell-bulgarian-split-squat",
      licenseLabel: "Dominio público",
      licenseUrl: "https://www.dvidshub.net/about/copyright",
    },
  },
  "Romanian Deadlift (RDL)": wgerVideo("romanian-deadlift", 507),
  "Hip Thrust con Mancuerna": wgerVideo("dumbbell-hip-thrust", 294),
  "Press Banca con Mancuernas": wgerVideo("dumbbell-bench-press", 75),
  "Press Banca Inclinado Mancuernas": wgerVideo("incline-dumbbell-bench-press", 537),
  "Remo con Mancuerna 1 Brazo": {
    kind: "photo",
    src: "/images/exercises/real-one-arm-dumbbell-row.webp",
    objectPosition: "center 42%",
    attribution: {
      label: "Jhon Macias · Pexels",
      sourceUrl: "https://www.pexels.com/photo/woman-performing-dumbbell-row-in-gym-34587497/",
    },
  },
  "Jalón al Pecho (Lat Pulldown)": {
    kind: "video",
    src: "/videos/exercises/lat-pulldown.m4v",
    poster: "/images/exercises/video-posters/lat-pulldown.webp",
    objectFit: "contain",
    attribution: {
      label: "khezez · Pexels",
      sourceUrl: "https://www.pexels.com/video/back-workout-in-gym-with-lat-pulldown-machine-35585699/",
    },
  },
  "Face Pull": wgerVideo("face-pull", 222),
  "Lateral Raise con Mancuernas": wgerVideo("dumbbell-lateral-raise", 348),
  "Curl Mancuernas Alternados": wgerVideo("alternating-dumbbell-curl", 92),
  "Tríceps Push-down Cable": {
    kind: "video",
    src: "/videos/exercises/cable-triceps-pushdown.m4v",
    poster: "/images/exercises/video-posters/cable-triceps-pushdown.webp",
    objectFit: "contain",
    attribution: {
      label: "Kampus Production · Pexels",
      sourceUrl: "https://www.pexels.com/video/an-instructor-teaching-a-man-how-to-do-triceps-pushdown-6892534/",
    },
  },
  "Elevación de Pantorrilla de Pie": wgerVideo("standing-calf-raise", 622),
  "Dead Bug": {
    kind: "photo",
    src: "/images/exercises/real-dead-bug.webp",
    attribution: {
      label: "Stephenie Tatum · DVIDS",
      sourceUrl: "https://www.dvidshub.net/image/1942620/step-fort-bragg-soldiers-civilians-learn-benefits-chirunning",
      licenseLabel: "Dominio público",
      licenseUrl: "https://www.dvidshub.net/about/copyright",
    },
  },
};

export function getExerciseMedia(name: string) {
  return EXERCISE_MEDIA[name] ?? null;
}
