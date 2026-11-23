import { test, expect, type Page } from "@playwright/test";

const PW = "demo-password-123";
const uid = Date.now().toString(36).slice(-5);

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PW);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/(chair|secretariat)/);
}

async function scoreCell(page: Page, delegation: string, col: number) {
  await page.goto("/chair/GA/scores");
  return Number(await page.getByTestId("score-table").locator("tr", { hasText: delegation }).locator("td").nth(col).textContent());
}

async function logout(page: Page) {
  await page.context().clearCookies();
}

test.describe.configure({ mode: "serial" });

let resolutionCode = "";
let resolutionRef = "";
const topicMarker = `marker-${uid}`;

test("home page shows the portal", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ALSMUN");
  await expect(page.getByRole("link", { name: /Submit an amendment/ }).first()).toBeVisible();
  await expect(page.getByText("Human Rights Council")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coming up" })).toBeVisible();
});

test("delegate submits a resolution and it stays hidden until approved", async ({ page }) => {
  await page.goto("/resolutions/submit?committee=GA");
  await expect(page.getByLabel("THIMUN resolution guide").getByText("How a THIMUN resolution is built")).toBeVisible();
  await page.getByLabel("Your delegation").selectOption({ label: "France" });
  await page.getByLabel("Question of (topic)").selectOption("The question of climate refugees");
  await page.getByLabel("Co-submitters").fill(`Japan, Kenya ${topicMarker}`);
  await page.getByRole("textbox", { name: "Preambulatory clause 1", exact: true }).fill("Recalling the 1951 Refugee Convention,");
  await page.getByRole("button", { name: "+ Add preambulatory clause" }).click();
  await page.getByRole("textbox", { name: "Preambulatory clause 2", exact: true }).fill("Deeply concerned by rising displacement,");
  await page.getByRole("textbox", { name: "Operative clause 1", exact: true }).fill("Calls upon all Member States to:\na) share data,\nb) fund reception centres;");
  await page.getByRole("button", { name: "+ Add operative clause" }).click();
  await page.getByRole("textbox", { name: "Operative clause 2", exact: true }).fill("Decides to remain actively seized of the matter.");
  await expect(page.getByText("Format check")).toHaveCount(0);

  await page.getByRole("tab", { name: "Preview in THIMUN format" }).click();
  await expect(page.locator(".reso em").first()).toHaveText("Recalling");
  await expect(page.locator(".reso u").first()).toHaveText("Calls upon");

  await page.getByRole("button", { name: "Submit resolution" }).click();
  await expect(page.getByRole("heading", { name: "Resolution submitted" })).toBeVisible();
  resolutionCode = (await page.getByTestId("tracking-code").textContent())!.trim();
  expect(resolutionCode).toMatch(/^R-/);
  resolutionRef = (await page.locator("strong", { hasText: "GA/R/" }).textContent())!.trim();

  await page.goto(`/track?code=${resolutionCode.toLowerCase()}`);
  await expect(page.getByTestId("track-result")).toContainText("Awaiting review");

  await page.goto("/resolutions?committee=GA");
  await expect(page.getByText(topicMarker)).toHaveCount(0);
});

test("format check warns about a badly formatted resolution", async ({ page }) => {
  await page.goto("/resolutions/submit?committee=GA");
  await page.getByRole("textbox", { name: "Preambulatory clause 1", exact: true }).fill("The sky is blue.");
  await page.getByRole("textbox", { name: "Operative clause 1", exact: true }).fill("Urges action;");
  await expect(page.getByText("should end with a comma")).toBeVisible();
  await expect(page.getByText("last operative clause should end with a full stop")).toBeVisible();
});

test("chair approves and chooses the resolution, which awards 3 points", async ({ page }) => {
  await login(page, "chair.ga@alsmun.test");
  await expect(page).toHaveURL(/\/chair\/GA$/);
  const before = await scoreCell(page, "France", 5);
  await page.goto("/chair/GA/resolutions?status=pending");
  const card = page.getByTestId("chair-resolution").filter({ hasText: resolutionRef });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: /Approve & choose/ }).click();
  await expect(page.getByTestId("chair-resolution").filter({ hasText: resolutionRef })).toHaveCount(0);

  await page.goto("/chair/GA/resolutions?status=chosen");
  await expect(page.getByTestId("chair-resolution").filter({ hasText: resolutionRef })).toContainText("Chosen for debate");

  expect(await scoreCell(page, "France", 5)).toBe(before + 1);
  await logout(page);

  await page.goto("/resolutions?committee=GA");
  await expect(page.getByText(topicMarker)).toBeVisible();
});

test("delegate amends; amendment appears publicly only after approval; choosing scores", async ({ page }) => {
  await page.goto("/amendments/submit?committee=GA");
  await expect(page.getByLabel("THIMUN amendment guide").getByText("How a THIMUN amendment works")).toBeVisible();
  await page.getByLabel("Your delegation").selectOption({ label: "Japan" });
  await page.getByLabel("Resolution being amended").selectOption({ index: 1 });
  await page.locator("fieldset").getByText("Modify", { exact: true }).click();
  await page.getByLabel("Clause", { exact: true }).fill("Clause 1, sub-clause b");
  const wording = `b) fund reception centres through a voluntary trust fund ${uid};`;
  await page.getByLabel("New wording of the clause").fill(wording);
  await page.getByRole("button", { name: "Submit amendment" }).click();
  await expect(page.getByRole("heading", { name: "Amendment submitted" })).toBeVisible();

  await page.goto("/amendments?committee=GA");
  await expect(page.getByText(wording)).toHaveCount(0);

  await login(page, "chair.ga@alsmun.test");
  await page.goto("/chair/GA/amendments");
  const card = page.getByTestId("amendment-card").filter({ hasText: wording });
  await card.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByTestId("amendment-card").filter({ hasText: wording })).toHaveCount(0);
  await logout(page);

  await page.goto("/amendments?committee=GA");
  await expect(page.getByTestId("amendment-card").filter({ hasText: wording })).toContainText("Approved");

  await login(page, "chair.ga@alsmun.test");
  const before = await scoreCell(page, "Japan", 4);
  await page.goto("/chair/GA/amendments?status=approved");
  await page.getByTestId("amendment-card").filter({ hasText: wording }).getByRole("button", { name: /Choose for debate/ }).click();
  await expect(page.getByTestId("amendment-card").filter({ hasText: wording })).toContainText("Chosen for debate");
  expect(await scoreCell(page, "Japan", 4)).toBe(before + 1);
});

test("chair rejects with a note, delegate sees it on the tracking page", async ({ page }) => {
  await page.goto("/amendments/submit?committee=GA");
  await page.getByLabel("Your delegation").selectOption({ label: "Kenya" });
  await page.getByLabel("Resolution being amended").selectOption({ index: 1 });
  await page.locator("fieldset").getByText("Strike", { exact: true }).click();
  await page.getByLabel("Clause", { exact: true }).fill(`Clause 2 ${uid}`);
  await page.getByRole("button", { name: "Submit amendment" }).click();
  const code = (await page.getByTestId("tracking-code").textContent())!.trim();

  await login(page, "chair.ga@alsmun.test");
  await page.goto("/chair/GA/amendments");
  const card = page.getByTestId("amendment-card").filter({ hasText: `Clause 2 ${uid}` });
  await card.getByRole("button", { name: "Reject…" }).click();
  await card.getByLabel(/Note to the delegate/).fill("Striking the final clause would leave the resolution without an ending.");
  await card.getByRole("button", { name: "Reject with note" }).click();
  await expect(page.getByTestId("amendment-card").filter({ hasText: `Clause 2 ${uid}` })).toHaveCount(0);
  await logout(page);

  await page.goto(`/track?code=${code}`);
  await expect(page.getByTestId("track-result")).toContainText("Rejected");
  await expect(page.getByTestId("track-result")).toContainText("without an ending");
});

test("chair tallies points, undoes one, and totals update", async ({ page }) => {
  await login(page, "chair.ga@alsmun.test");
  await page.goto("/chair/GA/points");
  const row = page.getByTestId("points-row").filter({ hasText: "Mexico" });
  const before = Number(await row.getByTestId("points-total").textContent());
  await row.getByRole("button", { name: "Add POI for Mexico" }).click();
  await row.getByRole("button", { name: "Add speech for Mexico" }).click();
  await row.getByRole("button", { name: "Add speech for Mexico" }).click();
  await expect(row.getByTestId("points-total")).toHaveText(String(before + 5));
  await page.reload();
  await expect(page.getByTestId("points-row").filter({ hasText: "Mexico" }).getByTestId("points-total")).toHaveText(String(before + 5));
  await page.getByRole("button", { name: "Undo Speech for Mexico" }).first().click();
  await expect(page.getByTestId("points-row").filter({ hasText: "Mexico" }).getByTestId("points-total")).toHaveText(String(before + 3));
});

test("chair takes attendance", async ({ page }) => {
  await login(page, "chair.ga@alsmun.test");
  await page.goto("/chair/GA/attendance");
  await page.getByLabel("New roll call").fill(`Roll ${uid}`);
  await page.getByRole("button", { name: "Start roll call" }).click();
  await expect(page.getByRole("heading", { name: `Roll ${uid}` })).toBeVisible();
  await page.getByRole("radio", { name: "Present and voting: France" }).click();
  await page.getByRole("radio", { name: "Absent: Brazil" }).click();
  await page.getByRole("button", { name: "Mark unmarked present" }).click();
  await page.reload();
  await expect(page.getByRole("radio", { name: "Present and voting: France" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("radio", { name: "Absent: Brazil" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("radio", { name: "Present: Egypt" })).toHaveAttribute("aria-checked", "true");
});

test("score sheet exports Excel and PDF", async ({ page }) => {
  await login(page, "chair.ga@alsmun.test");
  const xlsx = await page.request.get("/api/scores/GA/xlsx");
  expect(xlsx.status()).toBe(200);
  expect(xlsx.headers()["content-type"]).toContain("spreadsheetml");
  expect((await xlsx.body()).subarray(0, 2).toString()).toBe("PK");
  const pdf = await page.request.get("/api/scores/GA/pdf");
  expect(pdf.status()).toBe(200);
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
});

test("a chair cannot open another committee or the secretariat", async ({ page }) => {
  await login(page, "chair.ga@alsmun.test");
  await page.goto("/chair/SC/points");
  await expect(page).toHaveURL(/\/chair\/GA$/);
  await page.goto("/secretariat");
  await expect(page).toHaveURL(/\/chair\/GA$/);
  const res = await page.request.get("/api/scores/SC/xlsx");
  expect(res.status()).toBe(403);
});

test("signed-out visitors are sent to login", async ({ page }) => {
  await page.goto("/chair/GA/scores");
  await expect(page).toHaveURL(/\/login\?next=/);
  const res = await page.request.get("/api/scores/GA/pdf", { maxRedirects: 0 });
  expect([302, 307]).toContain(res.status());
});

test("wrong password is rejected", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("chair.ga@alsmun.test");
  await page.getByLabel("Password").fill("nope-nope-nope");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("don’t match an account")).toBeVisible();
});

test("chair uploads a report that delegates can download", async ({ page }) => {
  await login(page, "chair.ga@alsmun.test");
  await page.goto("/chair/GA/reports");
  await page.getByLabel("Title").fill(`Chair report ${uid}`);
  await page.getByLabel("File").setInputFiles({ name: "report.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n% test\n") });
  await page.getByRole("button", { name: "Upload report" }).click();
  await expect(page.getByText(`Uploaded “Chair report ${uid}”.`)).toBeVisible();
  await logout(page);

  await page.goto("/reports?committee=GA");
  const link = page.getByRole("link", { name: new RegExp(`Chair report ${uid}`) });
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  const file = await page.request.get(href!);
  expect(file.status()).toBe(200);
  expect(file.headers()["content-disposition"]).toContain("report.pdf");
});

test("secretariat manages chairs, schedule and settings", async ({ page }) => {
  await login(page, "secretariat@alsmun.test");
  await expect(page).toHaveURL(/\/secretariat$/);

  await page.goto("/secretariat/users");
  await page.getByLabel("Name", { exact: true }).fill(`HRC Chair ${uid}`);
  await page.getByLabel("Email").fill(`hrc-${uid}@alsmun.test`);
  await page.getByLabel("Committee", { exact: true }).selectOption({ label: "HRC · Human Rights Council" });
  await page.getByRole("button", { name: "Create account" }).click();
  const pw = (await page.getByTestId("new-password").textContent())!.trim();
  expect(pw.length).toBeGreaterThanOrEqual(12);

  await page.goto("/secretariat/schedule");
  await page.getByLabel("Title").fill(`Closing ceremony ${uid}`);
  await page.getByLabel("Starts").fill("2026-12-06T17:00");
  await page.getByLabel("Ends (optional)").fill("2026-12-06T18:00");
  await page.getByRole("button", { name: "Add to schedule" }).click();
  await expect(page.getByText(`Added “Closing ceremony ${uid}”.`)).toBeVisible();

  await page.goto("/secretariat/settings");
  await page.getByLabel("Announcement banner").fill(`Lunch moved to 13:00 ${uid}`);
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Settings saved.")).toBeVisible();
  await logout(page);

  await page.goto("/");
  await expect(page.getByText(`Lunch moved to 13:00 ${uid}`)).toBeVisible();
  await page.goto("/schedule");
  await expect(page.getByText(`Closing ceremony ${uid}`)).toBeVisible();
  await expect(page.getByText("17:00").first()).toBeVisible();

  // The new chair can sign in and lands on their committee.
  await page.goto("/login");
  await page.getByLabel("Email").fill(`hrc-${uid}@alsmun.test`);
  await page.getByLabel("Password").fill(pw);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/chair\/HRC$/);
});
