"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { trackingCode, resolutionRef, amendmentRef } from "@/lib/codes";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fieldErrors, str, type FormState } from "@/lib/form";
import { splitClauses } from "@/lib/thimun";

type Submitted = { code: string; reference: string };

async function resolveDelegation(committeeId: string, delegationId: string, delegationName: string) {
  if (delegationId) {
    const d = await db.delegation.findFirst({ where: { id: delegationId, committeeId } });
    return d;
  }
  const name = delegationName.trim().replace(/\s+/g, " ");
  if (!name) return null;
  // Free-text delegation is only allowed while the committee has no roster yet.
  const count = await db.delegation.count({ where: { committeeId } });
  const existing = await db.delegation.findFirst({ where: { committeeId, name: { equals: name, mode: "insensitive" } } });
  if (existing) return existing;
  if (count > 0) return null;
  return db.delegation.create({ data: { committeeId, name } });
}

/** Insert with the next per-committee number, retrying if two submissions race for it. */
async function withNextNumber<T>(
  model: "resolution" | "amendment",
  committeeId: string,
  create: (n: number) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const agg =
      model === "resolution"
        ? await db.resolution.aggregate({ where: { committeeId }, _max: { number: true } })
        : await db.amendment.aggregate({ where: { committeeId }, _max: { number: true } });
    try {
      return await create((agg._max.number ?? 0) + 1);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }
  throw new Error("Could not save. Please try again.");
}

const base = {
  committeeId: z.string().min(1, "Choose your committee."),
  delegationId: z.string().optional().default(""),
  delegationName: z.string().max(80, "Keep the delegation name under 80 characters.").optional().default(""),
};

const resolutionSchema = z.object({
  ...base,
  topic: z.string().trim().max(200).optional().default(""),
  coSubmitters: z.string().trim().max(600, "That list is too long.").optional().default(""),
  preambulatory: z.string().trim().min(1, "Add at least one preambulatory clause.").max(20000, "That is too long."),
  operative: z.string().trim().min(1, "Add at least one operative clause.").max(40000, "That is too long."),
});

export async function submitResolution(_prev: FormState<Submitted>, fd: FormData): Promise<FormState<Submitted>> {
  if (str(fd, "website")) return { ok: false, error: "Submission blocked." };
  const ip = await clientIp();
  if (!rateLimit(`sub:${ip}`, 20, 10 * 60 * 1000)) {
    return { ok: false, error: "Too many submissions from this device. Please wait a few minutes." };
  }
  const parsed = resolutionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;

  const committee = await db.committee.findUnique({ where: { id: v.committeeId } });
  if (!committee) return { ok: false, error: "That committee no longer exists.", fieldErrors: { committeeId: "Choose your committee." } };
  const delegation = await resolveDelegation(committee.id, v.delegationId, v.delegationName);
  if (!delegation) return { ok: false, error: "Please choose your delegation.", fieldErrors: { delegationId: "Choose your delegation from the list." } };
  if (splitClauses(v.preambulatory).length === 0 || splitClauses(v.operative).length === 0) {
    return { ok: false, error: "A resolution needs preambulatory and operative clauses." };
  }

  const code = trackingCode("R");
  const reso = await withNextNumber("resolution", committee.id, (number) =>
    db.resolution.create({
      data: {
        number,
        trackingCode: code,
        committeeId: committee.id,
        delegationId: delegation.id,
        topic: v.topic,
        coSubmitters: v.coSubmitters,
        preambulatory: v.preambulatory,
        operative: v.operative,
      },
    }),
  );
  return { ok: true, data: { code, reference: resolutionRef(committee.code, reso.number) } };
}

const amendmentSchema = z
  .object({
    ...base,
    resolutionId: z.string().optional().default(""),
    resolutionRef: z.string().trim().max(120).optional().default(""),
    clause: z.string().trim().min(1, "Say which clause you are amending.").max(120),
    action: z.enum(["ADD", "MODIFY", "STRIKE"], { error: "Choose add, modify or strike." }),
    text: z.string().trim().max(5000, "That is too long.").optional().default(""),
    rationale: z.string().trim().max(2000, "That is too long.").optional().default(""),
  })
  .refine((v) => v.action === "STRIKE" || v.text.length > 0, {
    path: ["text"],
    message: "Write the exact wording to add or the new wording for the clause.",
  })
  .refine((v) => v.resolutionId || v.resolutionRef, {
    path: ["resolutionId"],
    message: "Say which resolution this amendment is for.",
  });

export async function submitAmendment(_prev: FormState<Submitted>, fd: FormData): Promise<FormState<Submitted>> {
  if (str(fd, "website")) return { ok: false, error: "Submission blocked." };
  const ip = await clientIp();
  if (!rateLimit(`sub:${ip}`, 20, 10 * 60 * 1000)) {
    return { ok: false, error: "Too many submissions from this device. Please wait a few minutes." };
  }
  const parsed = amendmentSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;

  const committee = await db.committee.findUnique({ where: { id: v.committeeId } });
  if (!committee) return { ok: false, error: "That committee no longer exists.", fieldErrors: { committeeId: "Choose your committee." } };
  const delegation = await resolveDelegation(committee.id, v.delegationId, v.delegationName);
  if (!delegation) return { ok: false, error: "Please choose your delegation.", fieldErrors: { delegationId: "Choose your delegation from the list." } };

  let resolutionId: string | null = null;
  if (v.resolutionId) {
    const r = await db.resolution.findFirst({ where: { id: v.resolutionId, committeeId: committee.id, status: "APPROVED" } });
    if (!r) return { ok: false, error: "That resolution is not available.", fieldErrors: { resolutionId: "Choose a resolution from the list." } };
    resolutionId = r.id;
  }

  const code = trackingCode("A");
  const am = await withNextNumber("amendment", committee.id, (number) =>
    db.amendment.create({
      data: {
        number,
        trackingCode: code,
        committeeId: committee.id,
        delegationId: delegation.id,
        resolutionId,
        resolutionRef: resolutionId ? "" : v.resolutionRef,
        clause: v.clause,
        action: v.action,
        text: v.action === "STRIKE" ? "" : v.text,
        rationale: v.rationale,
      },
    }),
  );
  return { ok: true, data: { code, reference: amendmentRef(committee.code, am.number) } };
}
