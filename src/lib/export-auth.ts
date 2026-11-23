import { db } from "./db";
import { getCurrentUser } from "./auth";

export async function committeeForExport(code: string) {
  const user = await getCurrentUser();
  if (!user) return { error: new Response("Sign in required", { status: 401 }) } as const;
  const committee = await db.committee.findUnique({ where: { code: decodeURIComponent(code) } });
  if (!committee) return { error: new Response("Not found", { status: 404 }) } as const;
  if (user.role !== "SECRETARIAT" && user.committeeId !== committee.id) return { error: new Response("Forbidden", { status: 403 }) } as const;
  return { committee } as const;
}

export function exportFileName(code: string, ext: string) {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
  return `${code.replace(/[^\w]+/g, "_")}_score_sheet_${stamp}.${ext}`;
}
