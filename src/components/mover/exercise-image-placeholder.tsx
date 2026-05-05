type Props = { name: string; size?: number };

export function ExerciseImagePlaceholder({ name, size = 80 }: Props) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="rounded-lg bg-[var(--surface-alt)] border border-[var(--border-strong)] flex items-center justify-center font-bold text-muted-foreground"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-label={name}
    >
      {initial}
    </div>
  );
}
