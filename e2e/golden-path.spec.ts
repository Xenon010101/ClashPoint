import { expect, test } from "@playwright/test";

test("scripted demo produces all three verified cards and opens evidence", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Acme release review" })).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/consent-1440x900.png", fullPage: true });
  await page.getByRole("button", { name: /Start ClashPoint/ }).click();
  await page.getByRole("button", { name: /Run demo script/ }).click();

  await expect(page.getByRole("article").filter({ hasText: "Status mismatch" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("article").filter({ hasText: "Commitment conflict" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("article").filter({ hasText: "Capacity conflict" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Run demo script" })).toBeEnabled({ timeout: 5_000 });
  await page.screenshot({ path: "docs/screenshots/conflicts-1440x900.png" });

  await page.getByRole("button", { name: /Inspect evidence/ }).first().click();
  await expect(page.getByRole("dialog", { name: /Delivery Capacity Policy|Legal Review|Auth Refactor/ })).toBeVisible();
  await expect(page.getByText("Demo fixture", { exact: true })).toBeVisible();
  await page.waitForTimeout(250);
  await page.screenshot({ path: "docs/screenshots/evidence-1440x900.png" });
  await page.getByRole("button", { name: "Close evidence" }).click();

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: "docs/screenshots/console-1920x1080.png" });

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByRole("heading", { name: "Acme release review" })).toBeVisible();
});

test("manual turns use the same verified analysis pipeline", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: /manual/i }).click();
  await page.getByRole("button", { name: /Start ClashPoint/ }).click();
  await page.getByLabel("Transcript turn").fill("Let’s promise Feature X to Acme by Friday.");
  await page.getByRole("button", { name: "Submit turn" }).click();
  await expect(page.getByRole("article").filter({ hasText: "Commitment conflict" })).toBeVisible();
  await expect(page.getByText("Do not proceed with Feature X until the DPA update is approved.")).toBeVisible();
});
