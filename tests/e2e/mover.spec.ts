import { test, expect } from "@playwright/test";

test("mover page is auth-gated", async ({ page }) => {
  await page.goto("/mover");
  await expect(page).toHaveURL(/\/login/);
});

test("mover route returns < 500 for anonymous", async ({ page }) => {
  const response = await page.goto("/mover", { waitUntil: "domcontentloaded" });
  expect(response?.status() ?? 0).toBeLessThan(500);
});
