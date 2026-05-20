import { test, expect } from "@playwright/test";

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /acessar plataforma/i })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
});

test("forgot password shows supervisao message", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /esqueci minha senha/i }).click();
  await expect(page.getByText(/supervisão ou superior/i)).toBeVisible();
});

test("password field toggle shows and hides text", async ({ page }) => {
  await page.goto("/login");
  const passwordInput = page.getByLabel("Senha");
  await passwordInput.fill("minha-senha-teste");
  await expect(passwordInput).toHaveAttribute("type", "password");

  await page.getByRole("button", { name: /mostrar senha/i }).click();
  await expect(passwordInput).toHaveAttribute("type", "text");

  await page.getByRole("button", { name: /ocultar senha/i }).click();
  await expect(passwordInput).toHaveAttribute("type", "password");
});
