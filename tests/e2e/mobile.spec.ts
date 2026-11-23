import { test, expect } from "@playwright/test";

const PAGES = ["/", "/amendments", "/amendments/submit", "/resolutions", "/resolutions/submit", "/schedule", "/reports", "/track", "/guide", "/login"];

for (const path of PAGES) {
  test(`no horizontal scroll on ${path}`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("mobile menu opens and navigates", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.locator("#mobile-nav").getByRole("link", { name: "Schedule" }).click();
  await expect(page).toHaveURL(/\/schedule$/);
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
});

test("guide is available on the submit page on phones", async ({ page }) => {
  await page.goto("/resolutions/submit");
  await page.getByText("How to write a THIMUN resolution").click();
  await expect(page.locator("details").getByText("How a THIMUN resolution is built")).toBeVisible();
});

const STAFF_PAGES = ["/chair/GA", "/chair/GA/amendments", "/chair/GA/resolutions", "/chair/GA/points", "/chair/GA/attendance", "/chair/GA/scores", "/chair/GA/reports", "/chair/GA/setup"];

test("no horizontal scroll on chair pages", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("chair.ga@alsmun.test");
  await page.getByLabel("Password").fill("demo-password-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/chair\/GA$/);
  for (const path of STAFF_PAGES) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test("no horizontal scroll on secretariat pages", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("secretariat@alsmun.test");
  await page.getByLabel("Password").fill("demo-password-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/secretariat$/);
  for (const path of ["/secretariat", "/secretariat/users", "/secretariat/committees", "/secretariat/schedule", "/secretariat/settings", "/chair", "/account"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
