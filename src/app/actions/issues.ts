"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertCommitteeAccess, assertSecretariat, getCurrentUser } from "@/lib/auth";
import { fieldErrors, type FormState } from "@/lib/form";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const reportSchema = z
  .object({
    kind: z.enum(["STRIKE", "EQUIPMENT", "OTHER"], { error: "Choose what kind of problem this is." }),
    committeeId: z.string().optional().default(""),
    delegationId: z.string().optional().default(""),
    details: z.string().trim().min(3, "Describe the problem in a few words.").max(1000, "Keep it under 1000 characters."),
  })
  .refine((v) => v.kind !== "STRIKE" || v.delegationId, { path: ["delegationId"], message: "Choose the delegation that gets the strike." })
  .refine((v) => v.kind !== "STRIKE" || v.committeeId, { path: ["committeeId"], message: "Choose the committee." });

export async function reportIssue(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = reportSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  try {
    const user = v.committeeId ? await assertCommitteeAccess(v.committeeId) : await assertSecretariat();
    let delegationName = "";
    if (v.kind === "STRIKE") {
      const d = await db.delegation.findFirst({ where: { id: v.delegationId, committeeId: v.committeeId } });
      if (!d) return { ok: false, error: "That delegation isn’t in this committee.", fieldErrors: { delegationId: "Choose a delegation." } };
      delegationName = d.name;
    }
    await db.issue.create({
      data: {
        kind: v.kind,
        committeeId: v.committeeId || null,
        delegationId: v.kind === "STRIKE" ? v.delegationId : null,
        details: v.details,
        reportedBy: user.name,
      },
    });
    revalidatePath("/", "layout");
    const msg =
      v.kind === "STRIKE" ? `Strike recorded for ${delegationName}. The secretariat can see it.` : "Reported. The secretariat can see it now.";
    return { ok: true, message: msg };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

async function loadAndCheck(id: string) {
  const issue = await db.issue.findUnique({ where: { id } });
  if (!issue) throw new Error("That issue no longer exists.");
  const user = await getCurrentUser();
  if (!user) throw new Error("You are signed out. Please enter your code again.");
  if (user.role !== "SECRETARIAT" && (!issue.committeeId || issue.committeeId !== user.committeeId)) {
    throw new Error("You do not have access to this issue.");
  }
  return { issue, user };
}

export async function setIssueStatus(id: string, status: "OPEN" | "RESOLVED", note: string): Promise<Result> {
  try {
    await loadAndCheck(id);
    await db.issue.update({
      where: { id },
      data: {
        status,
        resolution: status === "RESOLVED" ? note.trim().slice(0, 1000) : "",
        resolvedAt: status === "RESOLVED" ? new Date() : null,
      },
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function deleteIssue(id: string): Promise<Result> {
  try {
    await loadAndCheck(id);
    await db.issue.delete({ where: { id } });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
  }
}
