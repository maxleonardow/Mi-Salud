export const APP_TIME_ZONE =
  process.env.NEXT_PUBLIC_APP_TIME_ZONE ?? "America/Monterrey";

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function partsInTimeZone(date: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = partsInTimeZone(date, timeZone);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return localAsUtc - Math.floor(date.getTime() / 1_000) * 1_000;
}

function localMidnightToUtc(dateKey: string, timeZone: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const guess = Date.UTC(year, month - 1, day);
  let result = guess - timeZoneOffsetMs(new Date(guess), timeZone);

  // Re-evaluate once at the resulting instant to handle offset transitions.
  result = guess - timeZoneOffsetMs(new Date(result), timeZone);
  return new Date(result);
}

export function getDateKey(
  date: Date = new Date(),
  timeZone: string = APP_TIME_ZONE
): string {
  const { year, month, day } = partsInTimeZone(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12));
  return date.toISOString().slice(0, 10);
}

export function dayOfWeekInTimeZone(
  date: Date = new Date(),
  timeZone: string = APP_TIME_ZONE
): number {
  const { year, month, day } = partsInTimeZone(date, timeZone);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function dayOfWeekForDateKey(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function getDayRangeIso(
  date: Date = new Date(),
  timeZone: string = APP_TIME_ZONE
): readonly [string, string] {
  const dateKey = getDateKey(date, timeZone);
  const nextDateKey = addDaysToDateKey(dateKey, 1);
  return [
    localMidnightToUtc(dateKey, timeZone).toISOString(),
    localMidnightToUtc(nextDateKey, timeZone).toISOString(),
  ];
}

export function getLastDaysRange(
  days: number,
  date: Date = new Date(),
  timeZone: string = APP_TIME_ZONE
): { dateKeys: string[]; startIso: string; endExclusiveIso: string } {
  if (!Number.isInteger(days) || days < 1) {
    throw new RangeError("days must be a positive integer");
  }

  const todayKey = getDateKey(date, timeZone);
  const dateKeys = Array.from({ length: days }, (_, index) =>
    addDaysToDateKey(todayKey, index - days + 1)
  );

  return {
    dateKeys,
    startIso: localMidnightToUtc(dateKeys[0], timeZone).toISOString(),
    endExclusiveIso: localMidnightToUtc(
      addDaysToDateKey(todayKey, 1),
      timeZone
    ).toISOString(),
  };
}

export function formatAppDate(
  date: Date,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("es-MX", {
    ...options,
    timeZone: APP_TIME_ZONE,
  }).format(date);
}

export function formatDateKey(
  dateKey: string,
  options: Intl.DateTimeFormatOptions
): string {
  return formatAppDate(new Date(`${dateKey}T12:00:00.000Z`), options);
}
