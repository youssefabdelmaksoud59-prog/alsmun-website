"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertSecretariat } from "@/lib/auth";
import { fieldErrors, type FormState } from "@/lib/form";
import { zonedToUtc } from "@/lib/time";

type Result = { ok: true } | { ok: false; error: string };

async function guard<T>(fn: () => Promise<T>): Promise<T | { ok: false; error: string }> {
  try {
    await assertSecretariat();
    return await fn();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

const announcementSchema = z.object({
  title: z.string().trim().min(2, "Write a short headline.").max(140, "Keep the headline under 140 characters."),
  body: z.string().trim().max(1000, "Keep it under 1000 characters.").optional().default(""),
});

export async function postAnnouncement(_prev: FormState, fd: FormData): Promise<FormState> {
  return guard(async () => {
    const parsed = announcementSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return { ok: false as const, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    await db.announcement.create({ data: parsed.data });
    revalidatePath("/", "layout");
    return { ok: true as const, message: "Announcement sent to every committee." };
  });
}

export async function deleteAnnouncement(id: string): Promise<Result> {
  return guard(async () => {
    await db.announcement.deleteMany({ where: { id } });
    revalidatePath("/", "layout");
    return { ok: true as const };
  });
}

const crisisSchema = z
  .object({
    committeeId: z.string().min(1, "Choose the committee."),
    title: z.string().trim().min(2, "Write a headline.").max(160, "Keep the headline under 160 characters."),
    body: z.string().trim().min(2, "Write the update.").max(5000, "Keep it under 5000 characters."),
    timing: z.enum(["now", "later"]).optional().default("now"),
    publishAt: z.string().optional().default(""),
  })
  .refine((v) => v.timing === "now" || v.publishAt, { path: ["publishAt"], message: "Choose when it should appear." });

export async function postCrisisUpdate(_prev: FormState, fd: FormData): Promise<FormState> {
  return guard(async () => {
    const parsed = crisisSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return { ok: false as const, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    const v = parsed.data;
    const committee = await db.committee.findUnique({ where: { id: v.committeeId } });
    if (!committee) return { ok: false as const, error: "That committee no longer exists." };
    let publishAt = new Date();
    if (v.timing === "later") {
      const at = zonedToUtc(v.publishAt);
      if (!at) return { ok: false as const, error: "Choose a valid time.", fieldErrors: { publishAt: "Invalid time." } };
      publishAt = at;
    }
    await db.crisisUpdate.create({ data: { committeeId: committee.id, title: v.title, body: v.body, publishAt } });
    revalidatePath("/", "layout");
    const later = publishAt.getTime() > Date.now() + 30_000;
    return { ok: true as const, message: later ? `Scheduled for ${committee.code}. Delegates will see it at the chosen time.` : `Published to ${committee.code}.` };
  });
}

export async function deleteCrisisUpdate(id: string): Promise<Result> {
  return guard(async () => {
    await db.crisisUpdate.deleteMany({ where: { id } });
    revalidatePath("/", "layout");
    return { ok: true as const };
  });
}
