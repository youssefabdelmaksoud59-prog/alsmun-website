/**
 * Seeds the ALSMUN V committees. Safe to run more than once.
 *
 *   npm run db:seed              committees only
 *   npm run db:seed -- --demo    also adds demo delegations, a schedule and demo access codes
 *   npm run db:seed -- --if-empty  only when there are no committees yet (used on every deploy,
 *                                  so committees the secretariat deletes don't come back)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const COMMITTEES: [code: string, name: string][] = [
  ["GA", "General Assembly"],
  ["SC", "Security Council"],
  ["HRC", "Human Rights Council"],
  ["ICJ", "International Court of Justice"],
  ["UNODC", "United Nations Office on Drugs and Crime"],
  ["SPECPOL", "Special Political and Decolonization Committee"],
  ["ECOSOC", "Economic and Social Council"],
  ["HSC", "Historical Security Council"],
  ["SCMA", "SCMA"],
  ["JA A", "JA A"],
  ["JA B", "JA B"],
];

const DEMO_DELEGATIONS = [
  "Brazil", "China", "Egypt", "France", "Germany", "India", "Japan", "Kenya", "Mexico",
  "Russian Federation", "Saudi Arabia", "South Africa", "United Kingdom", "United States of America",
];

async function main() {
  const demo = process.argv.includes("--demo");
  if (process.argv.includes("--if-empty") && (await db.committee.count()) > 0) {
    console.log("Committees already exist; leaving them as they are.");
    return;
  }
  for (const [i, [code, name]] of COMMITTEES.entries()) {
    await db.committee.upsert({ where: { code }, create: { code, name, sortOrder: i * 10 }, update: {} });
  }
  console.log(`Committees ready: ${COMMITTEES.map((c) => c[0]).join(", ")}`);

  if (!demo) return;

  const committees = await db.committee.findMany();
  for (const c of committees) {
    await db.delegation.createMany({ data: DEMO_DELEGATIONS.map((name) => ({ committeeId: c.id, name })), skipDuplicates: true });
  }
  const ga = committees.find((c) => c.code === "GA")!;
  await db.committee.update({ where: { id: ga.id }, data: { topics: "The question of climate refugees\nThe question of AI in warfare" } });

  if ((await db.scheduleItem.count()) === 0) {
    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);
    const at = (h: number, m = 0) => new Date(day.getTime() + ((h - 2) * 60 + m) * 60 * 1000); // Cairo is UTC+2
    await db.scheduleItem.createMany({
      data: [
        { title: "Registration and badges", startsAt: at(8), endsAt: at(9), location: "Main entrance" },
        { title: "Opening ceremony", startsAt: at(9), endsAt: at(10), location: "Main hall" },
        { title: "Committee session 1", startsAt: at(10, 15), endsAt: at(12, 30) },
        { title: "Lunch", startsAt: at(12, 30), endsAt: at(13, 30), location: "Cafeteria" },
        { title: "Committee session 2", startsAt: at(13, 30), endsAt: at(16) },
        { title: "GA lobbying", startsAt: at(16), endsAt: at(16, 45), committeeId: ga.id, location: "Room 101" },
      ],
    });
  }

  // Demo access codes. Never run --demo against the live database.
  await db.committee.update({ where: { id: ga.id }, data: { chairCode: "ga-demo-code" } });
  const sc = committees.find((c) => c.code === "SC")!;
  await db.committee.update({ where: { id: sc.id }, data: { chairCode: "sc-demo-code" } });
  await db.appSetting.upsert({
    where: { key: "secretariatCodeHash" },
    create: { key: "secretariatCodeHash", value: await bcrypt.hash("sec-demo-code", 11) },
    update: {},
  });
  console.log("Demo codes: GA chair ga-demo-code, SC chair sc-demo-code, secretariat sec-demo-code");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
