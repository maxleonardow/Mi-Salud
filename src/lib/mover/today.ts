export type ScheduleSlot = {
  day_of_week: number;
  template_id: string | null;
  activity_label: string | null;
};

export function dayOfWeek(date: Date): number {
  return dayOfWeekInTimeZone(date);
}

export function findScheduleSlotForToday<T extends ScheduleSlot>(
  slots: T[],
  date: Date = new Date()
): T | undefined {
  const dow = dayOfWeek(date);
  return slots.find(s => s.day_of_week === dow);
}
import { dayOfWeekInTimeZone } from "@/lib/date";
