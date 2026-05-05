import { describe, it, expect } from "vitest";
import { NAV_ITEMS, NAV_GROUPS, getActiveItem } from "@/lib/nav";

describe("nav metadata", () => {
  it("exposes 7 items (Hoy + 5 modules + Ajustes)", () => {
    expect(NAV_ITEMS).toHaveLength(7);
    const hrefs = NAV_ITEMS.map(i => i.href);
    expect(hrefs).toEqual([
      "/",
      "/habitos",
      "/suplementos",
      "/comer",
      "/mover",
      "/labs",
      "/ajustes",
    ]);
  });

  it("groups items into Hoy / Tracking / Salud / Cuenta", () => {
    expect(NAV_GROUPS.map(g => g.label)).toEqual(["Hoy", "Tracking", "Salud", "Cuenta"]);
  });

  it("returns the matching item for a given pathname", () => {
    expect(getActiveItem("/")?.label).toBe("Hoy");
    expect(getActiveItem("/habitos")?.label).toBe("Hábitos");
    expect(getActiveItem("/habitos/123")?.label).toBe("Hábitos");
    expect(getActiveItem("/desconocido")).toBeUndefined();
  });
});
