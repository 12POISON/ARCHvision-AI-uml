import { test, expect } from "@playwright/test";

/**
 * Core product loop: demo sign-in → project → AI-described diagram →
 * canvas renders → SVG export downloads.
 *
 * Runs against a real dev server + real Postgres (CI provides both).
 * Uses unique names per run so parallel/repeat runs never collide.
 */
test("core loop: sign in, create project, generate diagram, export SVG", async ({ page }) => {
  const stamp = Date.now().toString(36);
  const projectName = `E2E Project ${stamp}`;
  const diagramName = `E2E Diagram ${stamp}`;

  // 1. Demo sign-in.
  await page.goto("/login");
  await page.getByRole("button", { name: "Explore with demo access" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  // 2. New project (empty-state or header button, whichever renders).
  const newProjectButton = page
    .getByRole("button", { name: /^(New Project|Create your first project)$/ })
    .first();
  await newProjectButton.click();
  await page.locator("#np-name").fill(projectName);
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByText(projectName).first()).toBeVisible({ timeout: 20_000 });

  // 3. New diagram from the project card.
  await page.getByRole("button", { name: "Create new diagram" }).first().click();
  await expect(page.getByText("Create a diagram")).toBeVisible();
  await page.locator("#nd-name").fill(diagramName);
  await page
    .locator("#nd-desc")
    .fill("An online bookstore with Customer, Order and Book entities. A customer places many orders; each order contains many books.");
  await page.getByRole("button", { name: "Generate diagram" }).click();

  // 4. Editor loads with rendered canvas nodes.
  await expect(page).toHaveURL(/\/editor\//, { timeout: 30_000 });
  const nodes = page.locator(".react-flow__node");
  await expect(nodes.first()).toBeVisible({ timeout: 30_000 });
  expect(await nodes.count()).toBeGreaterThan(0);

  // 5. Export the diagram as SVG (real file download).
  await page.getByRole("button", { name: "Export" }).click();
  const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
  await page.getByRole("menuitem", { name: /SVG/ }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
});
