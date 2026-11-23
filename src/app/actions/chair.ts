"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, type ScoreType } from "@prisma/client";
import { db } from "@/lib/db";
import { assertCommitteeAccess } from "@/lib/auth";
import { POINTS } from "@/lib/scoring";
import { fieldErrors, str, type FormState } from "@/lib/form";

type Result = { ok: true } | { ok: false; error: string };

function refresh() {
  revalidatePath("/", "layout");
}

async function guard<T>(fn: () => Promise<T>): Promise<T | { ok: false; error: string }> {
  try {
    return await fn();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong.";
    return { ok: false, error: msg };
  }
}

/* ───────────── Review & choose ───────────── */

type Kind = "resolution" | "amendment";
type Decision = "APPROVED" | "REJECTED" | "PENDING";

async function loadItem(kind: Kind, id: string) {
  const item =
    kind === "resolution"
      ? await db.resolution.findUnique({ where: { id }, select: { id: true, committeeId: true, delegationId: true, chosen: true, status: true } })
      : await db.amendment.findUnique({ where: { id }, select: { id: true, committeeId: true, delegationId: true, chosen: true, status: true } });
  if (!item) throw new Error("That submission no longer exists.");
  return item;
}

export async function reviewSubmission(kind: Kind, id: string, decision: Decision, note: string): Promise<Result> {
  return guard(async () => {
    const item = await loadItem(kind, id);
    await assertCommitteeAccess(item.committeeId);
    const chairNote = note.trim().slice(0, 1000);
    const data = {
      status: decision,
      chairNote,
      reviewedAt: decision === "PENDING" ? null : new Date(),
      ...(decision !== "APPROVED" ? { chosen: false, chosenAt: null } : {}),
    };
    await db.$transaction(async (tx) => {
      if (kind === "resolution") await tx.resolution.update({ where: { id }, data });
      else await tx.amendment.update({ where: { id }, data });
      if (decision !== "APPROVED") {
        await tx.scoreEvent.deleteMany({ where: kind === "resolution" ? { resolutionId: id } : { amendmentId: id } });
      }
    });
    refresh();
    return { ok: true } as const;
  });
}

/** Choosing a submission for debate approves it (if needed) and awards its points. Un-choosing removes them. */
export async function setChosen(kind: Kind, id: string, chosen: boolean): Promise<Result> {
  return guard(async () => {
    const item = await loadItem(kind, id);
    const user = await assertCommitteeAccess(item.committeeId);
    if (chosen && item.status === "REJECTED") throw new Error("Approve it before choosing it for debate.");
    const type: ScoreType = kind === "resolution" ? "RESOLUTION" : "AMENDMENT";
    await db.$transaction(async (tx) => {
      const data = chosen
        ? { chosen: true, chosenAt: new Date(), status: "APPROVED" as const, reviewedAt: new Date() }
        : { chosen: false, chosenAt: null };
      if (kind === "resolution") await tx.resolution.update({ where: { id }, data });
      else await tx.amendment.update({ where: { id }, data });
      const link = kind === "resolution" ? { resolutionId: id } : { amendmentId: id };
      if (chosen) {
        const existing = await tx.scoreEvent.findFirst({ where: link });
        if (!existing) {
          await tx.scoreEvent.create({
            data: { ...link, committeeId: item.committeeId, delegationId: item.delegationId, type, points: POINTS[type], createdById: user.id },
          });
        }
      } else {
        await tx.scoreEvent.deleteMany({ where: link });
      }
    });
    refresh();
    return { ok: true } as const;
  });
}

/* ───────────── Points ───────────── */

export async function addScore(committeeId: string, delegationId: string, type: "POI" | "SPEECH"): Promise<Result> {
  return guard(async () => {
    const user = await assertCommitteeAccess(committeeId);
    if (type !== "POI" && type !== "SPEECH") throw new Error("Unknown point type.");
    const d = await db.delegation.findFirst({ where: { id: delegationId, committeeId } });
    if (!d) throw new Error("That delegation is not in this committee.");
    await db.scoreEvent.create({ data: { committeeId, delegationId, type, points: POINTS[type], createdById: user.id } });
    refresh();
    return { ok: true } as const;
  });
}

export async function deleteScore(eventId: string): Promise<Result> {
  return guard(async () => {
    const ev = await db.scoreEvent.findUnique({ where: { id: eventId } });
    if (!ev) return { ok: true } as const;
    await assertCommitteeAccess(ev.committeeId);
    if (ev.amendmentId || ev.resolutionId) {
      throw new Error("Remove this from debate on the amendments or resolutions page to take these points back.");
    }
    await db.scoreEvent.delete({ where: { id: eventId } });
    refresh();
    return { ok: true } as const;
  });
}

/* ───────────── Attendance ───────────── */

export async function createAttendanceSession(_prev: FormState, fd: FormData): Promise<FormState> {
  const committeeId = str(fd, "committeeId");
  const name = str(fd, "name").trim().slice(0, 80);
  const r = await guard(async () => {
    await assertCommitteeAccess(committeeId);
    if (!name) throw new Error("Give the session a name, such as “Session 1”.");
    const s = await db.attendanceSession.create({ data: { committeeId, name } });
    refresh();
    return { ok: true as const, data: { id: s.id } };
  });
  return r;
}

export async function renameAttendanceSession(sessionId: string, name: string): Promise<Result> {
  return guard(async () => {
    const s = await db.attendanceSession.findUnique({ where: { id: sessionId } });
    if (!s) throw new Error("That session no longer exists.");
    await assertCommitteeAccess(s.committeeId);
    const clean = name.trim().slice(0, 80);
    if (!clean) throw new Error("The name can’t be empty.");
    await db.attendanceSession.update({ where: { id: sessionId }, data: { name: clean } });
    refresh();
    return { ok: true } as const;
  });
}

export async function deleteAttendanceSession(sessionId: string): Promise<Result> {
  return guard(async () => {
    const s = await db.attendanceSession.findUnique({ where: { id: sessionId } });
    if (!s) return { ok: true } as const;
    await assertCommitteeAccess(s.committeeId);
    await db.attendanceSession.delete({ where: { id: sessionId } });
    refresh();
    return { ok: true } as const;
  });
}

const statusSchema = z.enum(["PRESENT", "PRESENT_AND_VOTING", "ABSENT"]);

export async function setAttendance(sessionId: string, delegationId: string, status: string | null): Promise<Result> {
  return guard(async () => {
    const s = await db.attendanceSession.findUnique({ where: { id: sessionId } });
    if (!s) throw new Error("That session no longer exists.");
    await assertCommitteeAccess(s.committeeId);
    const d = await db.delegation.findFirst({ where: { id: delegationId, committeeId: s.committeeId } });
    if (!d) throw new Error("That delegation is not in this committee.");
    if (status === null) {
      await db.attendanceRecord.deleteMany({ where: { sessionId, delegationId } });
    } else {
      const st = statusSchema.parse(status);
      await db.attendanceRecord.upsert({
        where: { sessionId_delegationId: { sessionId, delegationId } },
        create: { sessionId, delegationId, status: st },
        update: { status: st },
      });
    }
    refresh();
    return { ok: true } as const;
  });
}

export async function markAllUnmarked(sessionId: string, status: string): Promise<Result> {
  return guard(async () => {
    const s = await db.attendanceSession.findUnique({ where: { id: sessionId }, include: { records: true } });
    if (!s) throw new Error("That session no longer exists.");
    await assertCommitteeAccess(s.committeeId);
    const st = statusSchema.parse(status);
    const marked = new Set(s.records.map((r) => r.delegationId));
    const delegations = await db.delegation.findMany({ where: { committeeId: s.committeeId }, select: { id: true } });
    const todo = delegations.filter((d) => !marked.has(d.id));
    if (todo.length) {
      await db.attendanceRecord.createMany({ data: todo.map((d) => ({ sessionId, delegationId: d.id, status: st })), skipDuplicates: true });
    }
    refresh();
    return { ok: true } as const;
  });
}

/* ───────────── Roster & topics ───────────── */

export async function addDelegations(_prev: FormState, fd: FormData): Promise<FormState> {
  const committeeId = str(fd, "committeeId");
  return guard(async () => {
    await assertCommitteeAccess(committeeId);
    const names = [
      ...new Set(
        str(fd, "names")
          .split(/[\n,;]+/)
          .map((n) => n.trim().replace(/\s+/g, " "))
          .filter((n) => n.length > 0 && n.length <= 80),
      ),
    ];
    if (names.length === 0) throw new Error("Type at least one delegation name.");
    if (names.length > 300) throw new Error("Add at most 300 at a time.");
    const existing = await db.delegation.findMany({ where: { committeeId }, select: { name: true } });
    const have = new Set(existing.map((e) => e.name.toLowerCase()));
    const fresh = names.filter((n) => !have.has(n.toLowerCase()));
    if (fresh.length) await db.delegation.createMany({ data: fresh.map((name) => ({ committeeId, name })), skipDuplicates: true });
    refresh();
    const skipped = names.length - fresh.length;
    return { ok: true as const, message: `Added ${fresh.length} delegation${fresh.length === 1 ? "" : "s"}${skipped ? ` (${skipped} already on the list)` : ""}.` };
  });
}

export async function renameDelegation(delegationId: string, name: string): Promise<Result> {
  return guard(async () => {
    const d = await db.delegation.findUnique({ where: { id: delegationId } });
    if (!d) throw new Error("That delegation no longer exists.");
    await assertCommitteeAccess(d.committeeId);
    const clean = name.trim().replace(/\s+/g, " ").slice(0, 80);
    if (!clean) throw new Error("The name can’t be empty.");
    try {
      await db.delegation.update({ where: { id: delegationId }, data: { name: clean } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new Error("Another delegation already has that name.");
      throw e;
    }
    refresh();
    return { ok: true } as const;
  });
}

export async function deleteDelegation(delegationId: string): Promise<Result> {
  return guard(async () => {
    const d = await db.delegation.findUnique({
      where: { id: delegationId },
      include: { _count: { select: { resolutions: true, amendments: true, scoreEvents: true } } },
    });
    if (!d) return { ok: true } as const;
    await assertCommitteeAccess(d.committeeId);
    const c = d._count;
    if (c.resolutions + c.amendments + c.scoreEvents > 0) {
      throw new Error(`${d.name} already has submissions or points, so it can’t be removed. Rename it instead if it was a typo.`);
    }
    await db.delegation.delete({ where: { id: delegationId } });
    refresh();
    return { ok: true } as const;
  });
}

const topicsSchema = z.object({ committeeId: z.string().min(1), topics: z.string().max(2000, "That is too long.") });

export async function updateTopics(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = topicsSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: "Please fix the topics.", fieldErrors: fieldErrors(parsed.error) };
  return guard(async () => {
    await assertCommitteeAccess(parsed.data.committeeId);
    const topics = parsed.data.topics.split("\n").map((t) => t.trim()).filter(Boolean).join("\n");
    await db.committee.update({ where: { id: parsed.data.committeeId }, data: { topics } });
    refresh();
    return { ok: true as const, message: "Topics saved." };
  });
}

/* ───────────── Chair reports ───────────── */

const MAX_REPORT_BYTES = 4 * 1024 * 1024;
const ALLOWED_EXT = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "png", "jpg", "jpeg"];

export async function uploadReport(_prev: FormState, fd: FormData): Promise<FormState> {
  const committeeId = str(fd, "committeeId");
  return guard(async () => {
    const user = await assertCommitteeAccess(committeeId);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false as const, error: "Choose a file to upload.", fieldErrors: { file: "Choose a file." } };
    }
    if (file.size > MAX_REPORT_BYTES) {
      return { ok: false as const, error: "That file is larger than 4 MB. Please compress it or export a smaller PDF.", fieldErrors: { file: "Max 4 MB." } };
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.includes(ext)) {
      return { ok: false as const, error: `Upload a PDF, Word, PowerPoint, Excel, text or image file.`, fieldErrors: { file: "Unsupported file type." } };
    }
    const title = (str(fd, "title").trim() || file.name.replace(/\.[^.]+$/, "")).slice(0, 120);
    const buf = Buffer.from(await file.arrayBuffer());
    await db.chairReport.create({
      data: {
        committeeId,
        title,
        fileName: file.name.slice(0, 200),
        mimeType: file.type || "application/octet-stream",
        size: buf.length,
        data: buf,
        uploadedById: user.id,
      },
    });
    refresh();
    return { ok: true as const, message: `Uploaded “${title}”.` };
  });
}

export async function deleteReport(reportId: string): Promise<Result> {
  return guard(async () => {
    const r = await db.chairReport.findUnique({ where: { id: reportId }, select: { committeeId: true } });
    if (!r) return { ok: true } as const;
    await assertCommitteeAccess(r.committeeId);
    await db.chairReport.delete({ where: { id: reportId } });
    refresh();
    return { ok: true } as const;
  });
}
