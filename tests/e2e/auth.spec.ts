import { test, expect } from "@playwright/test";

test("logged-out user is redirected to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Mi Salud" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Contraseña")).toBeVisible();
});

test("login page submits password credentials", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("test+playwright@example.com");
  await page.getByLabel("Contraseña").fill("not-the-real-password");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Email o contraseña incorrectos")).toBeVisible({
    timeout: 15_000,
  });
});

test("password recovery page is public", async ({ page }) => {
  await page.goto("/recuperar-contrasena");
  await expect(
    page.getByRole("heading", { name: "Crear o recuperar contraseña" })
  ).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enviar recuperación" })
  ).toBeVisible();
});

test("password update page requires a recovery session", async ({ page }) => {
  await page.goto("/actualizar-contrasena");
  await expect(page).toHaveURL(/\/login/);
});
