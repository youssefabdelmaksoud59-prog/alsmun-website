import { test, expect, type Page } from "@playwright/test";

const uid = Date.now().toString(36).slice(-5);

test.describe.configure({ mode: "serial" });

async function loginSecretariat(page: Page) {
  await page.goto("/login/secretariat");
  await page.getByLabel("Secretariat code").fill("sec-demo-code");
  await page.getByRole("button", { name: "Open secretariat" }).click();
  await page.waitForURL((u) => u.pathname === "/secretariat");
}

async function loginGaChair(page: Page) {
  await page.goto("/login/chair");
  await page.getByLabel("Chair code").fill("ga-demo-code");
  await page.getByRole("button", { name: "Open chair portal" }).click();
  await page.waitForURL((u) => u.pathname === "/chair/GA");
}

const notice = `Room change ${uid}`;
const crisisNow = `Ceasefire collapses ${uid}`;
const crisisLater = `Embassy surrounded ${uid}`;

test("secretariat announcement appears on every committee's pages, for delegates and chairs", async ({ page }) => {
  await loginSecretariat(page);
  await page.goto("/secretariat/broadcast");
  await page.getByLabel("Headline").first().fill(notice);
  await page.getByLabel(/Details/).fill("GA moves to Room 204 after lunch.");
  await page.getByRole("button", { name: "Send to every committee" }).click();
  await expect(page.getByText("Announcement sent to every committee.")).toBeVisible();

  await page.context().clearCookies();
  for (const path of ["/delegate/GA", "/delegate/SC/amendments", "/delegate/HRC/schedule"]) {
    await page.goto(path);
    await expect(page.getByTestId("announcement").filter({ hasText: notice }), path).toBeVisible();
  }
  await expect(page.getByText("GA moves to Room 204 after lunch.")).toBeVisible();

  await loginGaChair(page);
  await expect(page.getByTestId("announcement").filter({ hasText: notice })).toBeVisible();
});

test("crisis update published now reaches only the chosen committee", async ({ page }) => {
  await loginSecretariat(page);
  await page.goto("/secretariat/broadcast");
  await page.getByLabel("Committee", { exact: true }).selectOption({ label: "GA · General Assembly" });
  await page.locator("#crisis-title").fill(crisisNow);
  await page.getByLabel("Update", { exact: true }).fill("Fighting has resumed along the northern border.");
  await page.getByRole("button", { name: "Publish crisis update" }).click();
  await expect(page.getByText("Published to GA.")).toBeVisible();

  await page.context().clearCookies();
  await page.goto("/delegate/GA");
  const banner = page.getByRole("region", { name: "Crisis update" });
  await expect(banner).toContainText(crisisNow);
  await page.getByRole("link", { name: "All crisis updates" }).click();
  await expect(page).toHaveURL(/\/delegate\/GA\/crisis$/);
  await expect(page.getByTestId("crisis-update").filter({ hasText: crisisNow })).toContainText("Fighting has resumed");

  await page.goto("/delegate/SC");
  await expect(page.getByText(crisisNow)).toHaveCount(0);
  await page.goto("/delegate/SC/crisis");
  await expect(page.getByText(crisisNow)).toHaveCount(0);
});

test("scheduled crisis update stays hidden from delegates but chairs see it in advance", async ({ page }) => {
  await loginSecretariat(page);
  await page.goto("/secretariat/broadcast");
  await page.getByLabel("Committee", { exact: true }).selectOption({ label: "GA · General Assembly" });
  await page.locator("#crisis-title").fill(crisisLater);
  await page.getByLabel("Update", { exact: true }).fill("Protesters have surrounded the embassy.");
  await page.getByLabel("At a set time").check();
  await expect(page.getByLabel("Publish at")).toHaveValue(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  await page.getByRole("button", { name: "Schedule crisis update" }).click();
  await expect(page.getByText("Scheduled for GA. Delegates will see it at the chosen time.")).toBeVisible();
  await expect(page.getByTestId("crisis-row").filter({ hasText: crisisLater })).toContainText("Scheduled for");

  await page.context().clearCookies();
  await page.goto("/delegate/GA/crisis");
  await expect(page.getByTestId("crisis-update").filter({ hasText: crisisNow })).toBeVisible();
  await expect(page.getByText(crisisLater)).toHaveCount(0);

  await loginGaChair(page);
  await page.goto("/chair/GA/crisis");
  await expect(page.getByTestId("crisis-update").filter({ hasText: crisisLater })).toContainText("Scheduled");
  await expect(page.getByTestId("crisis-update").filter({ hasText: crisisNow })).toBeVisible();
});

test("crisis form needs a committee and a time when scheduling", async ({ page }) => {
  await loginSecretariat(page);
  await page.goto("/secretariat/broadcast");
  await page.getByLabel("Committee", { exact: true }).selectOption({ label: "SC · Security Council" });
  await page.locator("#crisis-title").fill(`Empty time ${uid}`);
  await page.getByLabel("Update", { exact: true }).fill("Should not be saved.");
  await page.getByLabel("At a set time").check();
  await page.getByLabel("Publish at").fill("");
  // Bypass the browser's own required check to exercise the server validation.
  await page.locator("form", { has: page.locator("#crisis-title") }).evaluate((f) => f.setAttribute("novalidate", ""));
  await page.getByRole("button", { name: "Schedule crisis update" }).click();
  await expect(page.getByText("Choose when it should appear.")).toBeVisible();
  await expect(page.getByTestId("crisis-row").filter({ hasText: `Empty time ${uid}` })).toHaveCount(0);
});

test("secretariat deletes announcements and crisis updates", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await loginSecretariat(page);
  await page.goto("/secretariat/broadcast");
  for (const label of [notice, crisisNow, crisisLater]) {
    await page.getByRole("button", { name: `Delete ${label}` }).click();
    await expect(page.getByRole("button", { name: `Delete ${label}` })).toHaveCount(0);
  }
  await page.context().clearCookies();
  await page.goto("/delegate/GA");
  await expect(page.getByText(notice)).toHaveCount(0);
  await expect(page.getByText(crisisNow)).toHaveCount(0);
});

test("resources page has the rules, points and motions, and the THIMUN guide", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Resources" }).click();
  await expect(page).toHaveURL(/\/resources$/);
  await expect(page.getByRole("heading", { level: 2, name: "Rules of procedure" })).toBeVisible();
  await expect(page.getByText("The chair’s ruling on any point or motion is final.", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Points & motions" })).toBeVisible();
  await expect(page.getByRole("term").filter({ hasText: "Point of Personal Privilege" })).toBeVisible();
  await expect(page.getByRole("term").filter({ hasText: "Motion to move to the previous question" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "THIMUN guide" })).toBeVisible();
  await expect(page.getByText("How a THIMUN resolution is built")).toBeVisible();
  await expect(page.getByText("How a THIMUN amendment works")).toBeVisible();

  await page.getByRole("navigation", { name: "On this page" }).getByRole("link", { name: "Points & motions" }).click();
  await expect(page).toHaveURL(/#points-and-motions$/);

  await page.goto("/guide");
  await expect(page).toHaveURL(/\/resources#thimun-guide$/);
});
