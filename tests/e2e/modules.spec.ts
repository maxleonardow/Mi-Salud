import { expect, test } from "@playwright/test";

for (const route of ["/comer", "/labs", "/ajustes"]) {
  test(`${route} is protected for anonymous users`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status() ?? 0).toBeLessThan(500);
    await expect(page).toHaveURL(/\/login/);
  });
}
