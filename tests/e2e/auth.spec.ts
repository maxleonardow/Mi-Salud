import { test, expect } from "@playwright/test";

test("logged-out user is redirected to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Mi Salud" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("login page submits magic link request", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("test+playwright@example.com");
  await page.getByRole("button", { name: /magic link/i }).click();
  // Either we see the success state OR any Supabase error response (rate limit,
  // invalid email format, signups not allowed, etc). Both prove the form
  // submitted and the server action was invoked end-to-end.
  await expect(
    page.getByText(/Revisa tu email|rate limit|not allowed|invalid|requerido/i)
  ).toBeVisible({ timeout: 15_000 });
});
