import { expect, test } from "@playwright/test";

test("evidence inspection returns focus to its trigger", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: /manual/i }).click();
  await page.getByRole("button", { name: /Start ClashPoint/ }).click();
  await page.getByLabel("Transcript turn").fill("Let’s promise Feature X to Acme by Friday.");
  await page.getByRole("button", { name: "Submit turn" }).click();
  const trigger = page.getByRole("button", { name: /Inspect evidence/ });
  await trigger.focus();
  await trigger.click();
  await page.getByRole("button", { name: "Close evidence" }).click();
  await expect(trigger).toBeFocused();
});

test("evidence modal keeps Tab focus within its dialog", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: /manual/i }).click();
  await page.getByRole("button", { name: /Start ClashPoint/ }).click();
  await page.getByLabel("Transcript turn").fill("Let’s promise Feature X to Acme by Friday.");
  await page.getByRole("button", { name: "Submit turn" }).click();
  await page.getByRole("button", { name: /Inspect evidence/ }).click();
  const dialog = page.getByRole("dialog");
  const close = dialog.getByRole("button", { name: "Close evidence" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("link", { name: /Open demo source/ })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
});

test("evaluation inspection returns focus on close and Escape", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Start ClashPoint/ }).click();
  const trigger = page.getByRole("button", { name: "EVAL 27" });
  await trigger.focus();
  await trigger.click();
  const close = page.getByRole("button", { name: "Close evaluation" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(close).toBeFocused();
  await close.click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("optional live-source health remains separate from demo fixture readiness", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Start ClashPoint/ }).click();
  await page.getByRole("button", { name: "Check optional live GitHub source" }).click();
  await expect(page.getByRole("button", { name: "Check optional live GitHub source" })).toContainText("OFFLINE");
  await expect(page.getByText("DEMO SOURCES 2/2")).toBeVisible();
});

test("control-rail input mode communicates its selected state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Start ClashPoint/ }).click();
  const script = page.getByRole("button", { name: "script", exact: true });
  const manual = page.getByRole("button", { name: "manual", exact: true });
  const microphone = page.getByRole("button", { name: "microphone", exact: true });
  await expect(script).toHaveAttribute("aria-pressed", "true");
  await manual.click();
  await expect(manual).toHaveAttribute("aria-pressed", "true");
  await expect(script).toHaveAttribute("aria-pressed", "false");
  await microphone.click();
  await expect(microphone).toHaveAttribute("aria-pressed", "true");
});
