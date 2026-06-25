import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "客批" })).toBeVisible();
});

test("debug page loads", async ({ page }) => {
  await page.goto("/debug");
  await expect(page.getByRole("heading", { name: "调试页" })).toBeVisible();
});
