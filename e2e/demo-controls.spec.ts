import { expect, test } from "@playwright/test";

test("presenter advances three beats, pauses, and resets", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Start ClashPoint/ }).click();
  const next = page.getByRole("button", { name: "Next demo beat" });
  await next.click();
  await expect(page.locator(".resolution-card")).toHaveCount(1);
  await expect(next).toBeEnabled();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(next).toBeDisabled();
  await expect(page.getByRole("button", { name: "Run demo script" })).toBeDisabled();
  await page.getByRole("button", { name: "Resume" }).click();
  await next.click();
  await expect(page.locator(".resolution-card")).toHaveCount(2);
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page.locator(".resolution-card")).toHaveCount(3);
  await expect(next).toBeDisabled();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.getByRole("button", { name: /Start ClashPoint/ }).click();
  await expect(page.locator(".resolution-card")).toHaveCount(0);
  await expect(next).toBeEnabled();
});

test("scripted golden path completes within the 90-second judge budget", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: /Start ClashPoint/ }).click();
  const startedAt = Date.now();
  await page.getByRole("button", { name: "Run demo script" }).click();
  await expect(page.locator(".resolution-card")).toHaveCount(3, { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Demo complete" })).toBeDisabled();
  expect(Date.now() - startedAt).toBeLessThan(90_000);
});
