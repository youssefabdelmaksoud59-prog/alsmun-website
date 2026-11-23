import { test, expect } from "@playwright/test";

const PAGES = ["/", "/delegate", "/delegate/GA", "/delegate/GA/amendments", "/delegate/GA/amendments/submit", "/delegate/GA/resolutions", "/delegate/GA/resolutions/submit", "/delegate/GA/schedule", "/delegate/GA/reports", "/track", "/guide", "/login/chair", "/login/secretariat"];

for (const path of PAGES) {
  test(`no horizontal scroll on ${path}`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("mobile menu opens and navigates", async ({ page }) => {
  await page.goto("/delegate/GA");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.locator("#mobile-nav").getByRole("link", { name: "Schedule" }).click();
  await expect(page).toHaveURL(/\/delegate\/GA\/schedule$/);
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
});

test("guide is available on the submit page on phones", async ({ page }) => {
  await page.goto("/delegate/GA/resolutions/submit");
  await page.getByText("How to write a THIMUN resolution").click();
  await expect(page.locator("details").getByText("How a THIMUN resolution is built")).toBeVisible();
});

const STAFF_PAGES = ["/chair/GA/issues", "/chair/GA", "/chair/GA/amendments", "/chair/GA/resolutions", "/chair/GA/points", "/chair/GA/attendance", "/chair/GA/scores", "/chair/GA/reports", "/chair/GA/setup"];

test("no horizontal scroll on chair pages", async ({ page }) => {
  await page.goto("/login/chair");
  await page.getByLabel("Chair code").fill("ga-demo-code");
  await page.getByRole("button", { name: "Open chair portal" }).click();
  await page.waitForURL(/\/chair\/GA$/);
  for (const path of STAFF_PAGES) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test("no horizontal scroll on secretariat pages", async ({ page }) => {
  await page.goto("/login/secretariat");
  await page.getByLabel("Secretariat code").fill("sec-demo-code");
  await page.getByRole("button", { name: "Open secretariat" }).click();
  await page.waitForURL((u) => u.pathname === "/secretariat");
  for (const path of ["/secretariat", "/secretariat/issues", "/secretariat/codes", "/secretariat/committees", "/secretariat/schedule", "/secretariat/settings", "/chair"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
