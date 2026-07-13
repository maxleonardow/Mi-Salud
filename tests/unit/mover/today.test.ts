import { describe, it, expect } from "vitest";
import { dayOfWeek, findScheduleSlotForToday, type ScheduleSlot } from "@/lib/mover/today";

describe("today helpers", () => {
  it("dayOfWeek returns 0-6 in Sun-Sat order matching JS Date", () => {
    expect(dayOfWeek(new Date("2026-05-04T12:00:00Z"))).toBe(1); // Monday
    expect(dayOfWeek(new Date("2026-05-05T12:00:00Z"))).toBe(2); // Tuesday
    expect(dayOfWeek(new Date("2026-05-10T12:00:00Z"))).toBe(0); // Sunday
  });

  it("findScheduleSlotForToday returns the slot whose day_of_week matches", () => {
    const slots: ScheduleSlot[] = [
      { day_of_week: 1, template_id: "t-A", activity_label: null },
      { day_of_week: 2, template_id: null, activity_label: "Tenis 🎾" },
      { day_of_week: 3, template_id: "t-B", activity_label: null },
    ];
    const result = findScheduleSlotForToday(slots, new Date("2026-05-04T12:00:00Z"));
    expect(result?.template_id).toBe("t-A");
    const tueResult = findScheduleSlotForToday(slots, new Date("2026-05-05T12:00:00Z"));
    expect(tueResult?.activity_label).toBe("Tenis 🎾");
  });

  it("findScheduleSlotForToday returns undefined when no slot matches", () => {
    const slots: ScheduleSlot[] = [{ day_of_week: 1, template_id: "t-A", activity_label: null }];
    expect(findScheduleSlotForToday(slots, new Date("2026-05-05T12:00:00Z"))).toBeUndefined();
  });
});
