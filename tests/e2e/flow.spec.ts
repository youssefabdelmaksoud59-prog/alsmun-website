import { test, expect, type Page } from "@playwright/test";

const uid = Date.now().toString(36).slice(-5);
const GA_CODE = "ga-demo-code";
const SEC_CODE = "sec-demo-code";

async function login(page: Page, who: "chair" | "secretariat") {
  await page.goto(`/login/${who}`);
  await page.getByLabel(who === "chair" ? "Chair code" : "Secretariat code").fill(who === "chair" ? GA_CODE : SEC_CODE);
  await page.getByRole("button", { name: who === "chair" ? "Open chair portal" : "Open secretariat" }).click();
  await page.waitForURL((u) => u.pathname === (who === "chair" ? "/chair/GA" : "/secretariat"));
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

test("home asks for the role, and delegates pick a committee first", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Are you a delegate, a chair or the secretariat?")).toBeVisible();
  await page.getByRole("link", { name: /Delegate.*Choose your committee/ }).click();
  await expect(page).toHaveURL(/\/delegate$/);
  await page.getByRole("link", { name: /GA\s*General Assembly/ }).click();
  await expect(page).toHaveURL(/\/delegate\/GA$/);
  await expect(page.getByRole("heading", { name: "General Assembly" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Submit an amendment/ })).toBeVisible();
  await page.goto("/delegate");
  await expect(page.getByText("Continue where you left off")).toBeVisible();
  await page.goto("/amendments");
  await expect(page).toHaveURL(/\/delegate$/);
});

test("delegate submits a resolution and it stays hidden until approved", async ({ page }) => {
  await page.goto("/delegate/GA/resolutions/submit");
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

  await page.goto("/delegate/GA/resolutions");
  await expect(page.getByText(topicMarker)).toHaveCount(0);
});

test("format check warns about a badly formatted resolution", async ({ page }) => {
  await page.goto("/delegate/GA/resolutions/submit");
  await page.getByRole("textbox", { name: "Preambulatory clause 1", exact: true }).fill("The sky is blue.");
  await page.getByRole("textbox", { name: "Operative clause 1", exact: true }).fill("Urges action;");
  await expect(page.getByText("should end with a comma")).toBeVisible();
  await expect(page.getByText("last operative clause should end with a full stop")).toBeVisible();
});

test("chair approves and chooses the resolution, which awards 3 points", async ({ page }) => {
  await login(page, "chair");
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

  await page.goto("/delegate/GA/resolutions");
  await expect(page.getByText(topicMarker)).toBeVisible();
});

test("delegate amends; amendment appears publicly only after approval; choosing scores", async ({ page }) => {
  await page.goto("/delegate/GA/amendments/submit");
  await expect(page.getByLabel("THIMUN amendment guide").getByText("How a THIMUN amendment works")).toBeVisible();
  await page.getByLabel("Your delegation").selectOption({ label: "Japan" });
  await page.getByLabel("Resolution being amended").selectOption({ index: 1 });
  await page.locator("fieldset").getByText("Modify", { exact: true }).click();
  await page.getByLabel("Clause", { exact: true }).fill("Clause 1, sub-clause b");
  const wording = `b) fund reception centres through a voluntary trust fund ${uid};`;
  await page.getByLabel("New wording of the clause").fill(wording);
  await page.getByRole("button", { name: "Submit amendment" }).click();
  await expect(page.getByRole("heading", { name: "Amendment submitted" })).toBeVisible();

  await page.goto("/delegate/GA/amendments");
  await expect(page.getByText(wording)).toHaveCount(0);

  await login(page, "chair");
  await page.goto("/chair/GA/amendments");
  const card = page.getByTestId("amendment-card").filter({ hasText: wording });
  await card.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByTestId("amendment-card").filter({ hasText: wording })).toHaveCount(0);
  await logout(page);

  await page.goto("/delegate/GA/amendments");
  await expect(page.getByTestId("amendment-card").filter({ hasText: wording })).toContainText("Approved");

  await login(page, "chair");
  const before = await scoreCell(page, "Japan", 4);
  await page.goto("/chair/GA/amendments?status=approved");
  await page.getByTestId("amendment-card").filter({ hasText: wording }).getByRole("button", { name: /Choose for debate/ }).click();
  await expect(page.getByTestId("amendment-card").filter({ hasText: wording })).toContainText("Chosen for debate");
  expect(await scoreCell(page, "Japan", 4)).toBe(before + 1);
});

test("chair rejects with a note, delegate sees it on the tracking page", async ({ page }) => {
  await page.goto("/delegate/GA/amendments/submit");
  await page.getByLabel("Your delegation").selectOption({ label: "Kenya" });
  await page.getByLabel("Resolution being amended").selectOption({ index: 1 });
  await page.locator("fieldset").getByText("Strike", { exact: true }).click();
  await page.getByLabel("Clause", { exact: true }).fill(`Clause 2 ${uid}`);
  await page.getByRole("button", { name: "Submit amendment" }).click();
  const code = (await page.getByTestId("tracking-code").textContent())!.trim();

  await login(page, "chair");
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
  await login(page, "chair");
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
  await login(page, "chair");
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
  await login(page, "chair");
  const xlsx = await page.request.get("/api/scores/GA/xlsx");
  expect(xlsx.status()).toBe(200);
  expect(xlsx.headers()["content-type"]).toContain("spreadsheetml");
  expect((await xlsx.body()).subarray(0, 2).toString()).toBe("PK");
  const pdf = await page.request.get("/api/scores/GA/pdf");
  expect(pdf.status()).toBe(200);
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
});

test("a chair cannot open another committee or the secretariat", async ({ page }) => {
  await login(page, "chair");
  await page.goto("/chair/SC/points");
  await expect(page).toHaveURL(/\/chair\/GA$/);
  await page.goto("/secretariat");
  await expect(page).toHaveURL(/\/login\/secretariat/);
  const res = await page.request.get("/api/scores/SC/xlsx");
  expect(res.status()).toBe(403);
});

test("signed-out visitors are sent to the right code page", async ({ page }) => {
  await page.goto("/chair/GA/scores");
  await expect(page).toHaveURL(/\/login\/chair\?next=/);
  await page.goto("/secretariat/issues");
  await expect(page).toHaveURL(/\/login\/secretariat\?next=/);
  const res = await page.request.get("/api/scores/GA/pdf", { maxRedirects: 0 });
  expect([302, 307]).toContain(res.status());
});

test("wrong codes are rejected", async ({ page }) => {
  await page.goto("/login/chair");
  await page.getByLabel("Chair code").fill("not-a-real-code");
  await page.getByRole("button", { name: "Open chair portal" }).click();
  await expect(page.getByText("That chair code isn’t right")).toBeVisible();
  await page.goto("/login/secretariat");
  await page.getByLabel("Secretariat code").fill(GA_CODE);
  await page.getByRole("button", { name: "Open secretariat" }).click();
  await expect(page.getByText("That secretariat code isn’t right")).toBeVisible();
});

test("chair gives a strike and reports missing equipment; secretariat sees and resolves them", async ({ page }) => {
  await login(page, "chair");
  await page.goto("/chair/GA/issues");
  await page.getByLabel("Delegation", { exact: true }).selectOption({ label: "Brazil" });
  await page.getByLabel("Reason for the strike").fill(`Used phone during voting ${uid}`);
  await page.getByRole("button", { name: "Give strike" }).click();
  await expect(page.getByText("Strike recorded for Brazil")).toBeVisible();
  await page.locator("label", { hasText: "Missing equipment" }).click();
  await page.getByLabel("What is missing, and where?").fill(`Projector missing ${uid}`);
  await page.getByRole("button", { name: "Send to secretariat" }).click();
  await expect(page.getByText("Reported. The secretariat can see it now.")).toBeVisible();
  await expect(page.getByTestId("strike-summary")).toContainText("Brazil");
  await logout(page);

  await login(page, "secretariat");
  const strike = page.getByTestId("issue").filter({ hasText: `Used phone during voting ${uid}` });
  await expect(strike).toContainText("GA");
  await expect(strike).toContainText("Brazil");
  const equipment = page.getByTestId("issue").filter({ hasText: `Projector missing ${uid}` });
  await equipment.getByRole("button", { name: "Resolve…" }).click();
  await equipment.getByLabel("Resolution note").fill("Spare projector delivered");
  await equipment.getByRole("button", { name: "Mark resolved" }).click();
  await expect(page.getByTestId("issue").filter({ hasText: `Projector missing ${uid}` })).toHaveCount(0);
  await page.goto("/secretariat/issues?show=resolved");
  await expect(page.getByTestId("issue").filter({ hasText: `Projector missing ${uid}` })).toContainText("Spare projector delivered");
});

test("chair uploads a report that delegates can download", async ({ page }) => {
  await login(page, "chair");
  await page.goto("/chair/GA/reports");
  await page.getByLabel("Title").fill(`Chair report ${uid}`);
  await page.getByLabel("File").setInputFiles({ name: "report.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n% test\n") });
  await page.getByRole("button", { name: "Upload report" }).click();
  await expect(page.getByText(`Uploaded “Chair report ${uid}”.`)).toBeVisible();
  await logout(page);

  await page.goto("/delegate/GA/reports");
  const link = page.getByRole("link", { name: new RegExp(`Chair report ${uid}`) });
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  const file = await page.request.get(href!);
  expect(file.status()).toBe(200);
  expect(file.headers()["content-disposition"]).toContain("report.pdf");
});

test("secretariat sets chair codes, schedule and settings", async ({ page }) => {
  await login(page, "secretariat");

  const hrcCode = `hrc-${uid}-code`;
  await page.goto("/secretariat/codes");
  const row = (code: string) => page.getByTestId("chair-code-row").filter({ has: page.getByLabel(`Chair code for ${code}`, { exact: true }) });
  await page.getByLabel("Chair code for HRC", { exact: true }).fill(hrcCode);
  await row("HRC").getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("HRC chair code saved.")).toBeVisible();
  await page.getByLabel("Chair code for SC", { exact: true }).fill(GA_CODE);
  await row("SC").getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("GA already uses that code")).toBeVisible();

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

  // The secretariat can open any committee's chair tools.
  await page.goto("/chair/SC/points");
  await expect(page.getByRole("heading", { name: /Security Council/ })).toBeVisible();
  await logout(page);

  await page.goto("/");
  await expect(page.getByText(`Lunch moved to 13:00 ${uid}`)).toBeVisible();
  await page.goto("/delegate/GA/schedule");
  await expect(page.getByText(`Closing ceremony ${uid}`)).toBeVisible();
  await expect(page.getByText("17:00").first()).toBeVisible();

  // HRC chairs can now open their portal with the new code.
  await page.goto("/login/chair");
  await page.getByLabel("Chair code").fill(hrcCode.toUpperCase());
  await page.getByRole("button", { name: "Open chair portal" }).click();
  await expect(page).toHaveURL(/\/chair\/HRC$/);
});
