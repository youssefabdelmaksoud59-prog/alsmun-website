/**
 * Seeds the ALSMUN V committees. Safe to run more than once.
 *
 *   npm run db:seed              committees only
 *   npm run db:seed -- --demo    also adds demo delegations, a schedule and a demo secretariat login
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

  const email = "secretariat@alsmun.test";
  if (!(await db.user.findUnique({ where: { email } }))) {
    await db.user.create({ data: { email, name: "Demo Secretariat", role: "SECRETARIAT", passwordHash: await bcrypt.hash("demo-password-123", 11) } });
    await db.user.create({ data: { email: "chair.ga@alsmun.test", name: "Demo GA Chair", role: "CHAIR", committeeId: ga.id, passwordHash: await bcrypt.hash("demo-password-123", 11) } });
    console.log("Demo logins: secretariat@alsmun.test / chair.ga@alsmun.test, password demo-password-123");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
