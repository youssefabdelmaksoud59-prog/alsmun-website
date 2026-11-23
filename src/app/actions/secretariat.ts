"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { assertSecretariat, hashPassword } from "@/lib/auth";
import { fieldErrors, str, type FormState } from "@/lib/form";
import { zonedToUtc } from "@/lib/time";
import { DEFAULT_SETTINGS } from "@/lib/settings";

type Result = { ok: true; message?: string } | { ok: false; error: string };

function refresh() {
  revalidatePath("/", "layout");
}

function tempPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const b = randomBytes(12);
  let out = "";
  for (let i = 0; i < 12; i++) out += alphabet[b[i] % alphabet.length];
  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8)}`;
}

async function wrap<T extends { ok: boolean }>(fn: () => Promise<T>): Promise<T | { ok: false; error: string }> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "That already exists. Use a different value." };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

/* ───────────── Users ───────────── */

const userSchema = z.object({
  name: z.string().trim().min(2, "Enter a name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.enum(["CHAIR", "SECRETARIAT"]),
  committeeId: z.string().optional().default(""),
  password: z.string().max(200).optional().default(""),
});

export async function createUser(_prev: FormState, fd: FormData): Promise<FormState> {
  return wrap(async () => {
    await assertSecretariat();
    const parsed = userSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return { ok: false as const, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    const v = parsed.data;
    if (v.role === "CHAIR" && !v.committeeId) return { ok: false as const, error: "Choose the chair’s committee.", fieldErrors: { committeeId: "Choose a committee." } };
    if (v.password && v.password.length < 10) return { ok: false as const, error: "Passwords need at least 10 characters.", fieldErrors: { password: "At least 10 characters." } };
    const password = v.password || tempPassword();
    await db.user.create({
      data: {
        name: v.name,
        email: v.email,
        role: v.role,
        committeeId: v.role === "CHAIR" ? v.committeeId : v.committeeId || null,
        passwordHash: await hashPassword(password),
      },
    });
    refresh();
    return { ok: true as const, message: `Account created for ${v.email}. Password: ${password}`, data: { password } };
  });
}

export async function updateUser(userId: string, patch: { committeeId?: string | null; role?: "CHAIR" | "SECRETARIAT"; active?: boolean; name?: string }): Promise<Result> {
  return wrap(async () => {
    const me = await assertSecretariat();
    if (userId === me.id && (patch.active === false || patch.role === "CHAIR")) {
      throw new Error("You can’t demote or disable your own account.");
    }
    if (patch.role === "CHAIR" || patch.active === false) {
      const target = await db.user.findUnique({ where: { id: userId } });
      if (target?.role === "SECRETARIAT") {
        const others = await db.user.count({ where: { role: "SECRETARIAT", active: true, id: { not: userId } } });
        if (others === 0) throw new Error("There must always be at least one active secretariat account.");
      }
    }
    await db.user.update({
      where: { id: userId },
      data: {
        ...(patch.committeeId !== undefined ? { committeeId: patch.committeeId || null } : {}),
        ...(patch.role ? { role: patch.role } : {}),
        ...(patch.active !== undefined ? { active: patch.active } : {}),
        ...(patch.name ? { name: patch.name.trim().slice(0, 80) } : {}),
      },
    });
    refresh();
    return { ok: true as const };
  });
}

export async function resetUserPassword(userId: string): Promise<Result> {
  return wrap(async () => {
    await assertSecretariat();
    const password = tempPassword();
    const u = await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password) } });
    refresh();
    return { ok: true as const, message: `New password for ${u.email}: ${password}` };
  });
}

export async function deleteUser(userId: string): Promise<Result> {
  return wrap(async () => {
    const me = await assertSecretariat();
    if (userId === me.id) throw new Error("You can’t delete your own account.");
    const target = await db.user.findUnique({ where: { id: userId } });
    if (target?.role === "SECRETARIAT") {
      const others = await db.user.count({ where: { role: "SECRETARIAT", active: true, id: { not: userId } } });
      if (others === 0) throw new Error("There must always be at least one active secretariat account.");
    }
    await db.user.delete({ where: { id: userId } });
    refresh();
    return { ok: true as const };
  });
}

/* ───────────── Committees ───────────── */

const committeeSchema = z.object({
  id: z.string().optional().default(""),
  code: z
    .string()
    .trim()
    .min(1, "Enter a short code.")
    .max(16, "Keep the code under 16 characters.")
    .regex(/^[A-Za-z0-9][A-Za-z0-9 \-]*$/, "Use letters, numbers, spaces or dashes."),
  name: z.string().trim().min(2, "Enter the full name.").max(120),
  topics: z.string().max(2000).optional().default(""),
  sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
});

export async function saveCommittee(_prev: FormState, fd: FormData): Promise<FormState> {
  return wrap(async () => {
    await assertSecretariat();
    const parsed = committeeSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return { ok: false as const, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    const v = parsed.data;
    const data = {
      code: v.code.toUpperCase().replace(/\s+/g, " "),
      name: v.name,
      topics: v.topics.split("\n").map((t) => t.trim()).filter(Boolean).join("\n"),
      sortOrder: v.sortOrder,
    };
    if (v.id) await db.committee.update({ where: { id: v.id }, data });
    else await db.committee.create({ data });
    refresh();
    return { ok: true as const, message: v.id ? `Saved ${data.code}.` : `Added ${data.code}.` };
  });
}

export async function deleteCommittee(committeeId: string): Promise<Result> {
  return wrap(async () => {
    await assertSecretariat();
    const c = await db.committee.findUnique({
      where: { id: committeeId },
      include: { _count: { select: { resolutions: true, amendments: true, scoreEvents: true, reports: true } } },
    });
    if (!c) return { ok: true as const };
    const n = c._count.resolutions + c._count.amendments + c._count.scoreEvents + c._count.reports;
    if (n > 0) throw new Error(`${c.code} already has submissions, points or reports, so it can’t be deleted.`);
    await db.committee.delete({ where: { id: committeeId } });
    refresh();
    return { ok: true as const };
  });
}

/* ───────────── Schedule ───────────── */

const scheduleSchema = z
  .object({
    id: z.string().optional().default(""),
    title: z.string().trim().min(1, "Enter a title.").max(120),
    description: z.string().trim().max(1000).optional().default(""),
    location: z.string().trim().max(120).optional().default(""),
    committeeId: z.string().optional().default(""),
    startsAt: z.string().min(1, "Choose a start time."),
    endsAt: z.string().optional().default(""),
  });

export async function saveScheduleItem(_prev: FormState, fd: FormData): Promise<FormState> {
  return wrap(async () => {
    await assertSecretariat();
    const parsed = scheduleSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return { ok: false as const, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    const v = parsed.data;
    const startsAt = zonedToUtc(v.startsAt);
    if (!startsAt) return { ok: false as const, error: "Choose a valid start time.", fieldErrors: { startsAt: "Invalid time." } };
    const endsAt = v.endsAt ? zonedToUtc(v.endsAt) : null;
    if (v.endsAt && !endsAt) return { ok: false as const, error: "Choose a valid end time.", fieldErrors: { endsAt: "Invalid time." } };
    if (endsAt && endsAt <= startsAt) return { ok: false as const, error: "The end time must be after the start.", fieldErrors: { endsAt: "Must be after the start." } };
    const data = { title: v.title, description: v.description, location: v.location, committeeId: v.committeeId || null, startsAt, endsAt };
    if (v.id) await db.scheduleItem.update({ where: { id: v.id }, data });
    else await db.scheduleItem.create({ data });
    refresh();
    return { ok: true as const, message: v.id ? "Saved." : `Added “${v.title}”.` };
  });
}

export async function deleteScheduleItem(id: string): Promise<Result> {
  return wrap(async () => {
    await assertSecretariat();
    await db.scheduleItem.deleteMany({ where: { id } });
    refresh();
    return { ok: true as const };
  });
}

/* ───────────── Settings ───────────── */

export async function saveSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  return wrap(async () => {
    await assertSecretariat();
    const keys = Object.keys(DEFAULT_SETTINGS) as (keyof typeof DEFAULT_SETTINGS)[];
    const limits: Record<string, number> = { conferenceName: 60, tagline: 160, dates: 80, venue: 120, announcement: 600 };
    const name = str(fd, "conferenceName").trim();
    if (!name) return { ok: false as const, error: "The conference name can’t be empty.", fieldErrors: { conferenceName: "Required." } };
    await db.$transaction(
      keys.map((key) => {
        const value = str(fd, key).trim().slice(0, limits[key] ?? 200);
        return db.appSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
      }),
    );
    refresh();
    return { ok: true as const, message: "Settings saved." };
  });
}
