import { describe, expect, it } from "vitest";
import {
  dayOfWeekInTimeZone,
  getDateKey,
  getDayRangeIso,
  getLastDaysRange,
} from "@/lib/date";

describe("date helpers", () => {
  it("uses the app timezone near a UTC day boundary", () => {
    const instant = new Date("2026-07-13T04:30:00.000Z");
    expect(getDateKey(instant, "America/Monterrey")).toBe("2026-07-12");
    expect(dayOfWeekInTimeZone(instant, "America/Monterrey")).toBe(0);
  });

  it("builds a half-open local-day range", () => {
    const instant = new Date("2026-07-13T04:30:00.000Z");
    expect(getDayRangeIso(instant, "America/Monterrey")).toEqual([
      "2026-07-12T06:00:00.000Z",
      "2026-07-13T06:00:00.000Z",
    ]);
  });

  it("includes today in a seven-day adherence window", () => {
    const range = getLastDaysRange(
      7,
      new Date("2026-07-13T04:30:00.000Z"),
      "America/Monterrey"
    );
    expect(range.dateKeys).toEqual([
      "2026-07-06",
      "2026-07-07",
      "2026-07-08",
      "2026-07-09",
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
    ]);
    expect(range.startIso).toBe("2026-07-06T06:00:00.000Z");
    expect(range.endExclusiveIso).toBe("2026-07-13T06:00:00.000Z");
  });
});
