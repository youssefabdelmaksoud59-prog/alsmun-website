import type { IssueKind } from "@prisma/client";
import { db } from "./db";

export const ISSUE_LABEL: Record<IssueKind, string> = { STRIKE: "Strike", EQUIPMENT: "Missing equipment", OTHER: "Other problem" };

/** Number of strikes at which a delegation is highlighted as needing secretariat attention. */
export const STRIKE_ALERT = 3;

export async function strikeCounts(committeeId?: string) {
  const rows = await db.issue.groupBy({
    by: ["delegationId"],
    where: { kind: "STRIKE", delegationId: { not: null }, ...(committeeId ? { committeeId } : {}) },
    _count: true,
  });
  const ids = rows.map((r) => r.delegationId!).filter(Boolean);
  const delegations = await db.delegation.findMany({ where: { id: { in: ids } }, include: { committee: { select: { code: true } } } });
  return rows
    .map((r) => {
      const d = delegations.find((x) => x.id === r.delegationId);
      return d ? { delegationId: d.id, name: d.name, committee: d.committee.code, count: r._count } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export const issueInclude = {
  committee: { select: { code: true } },
  delegation: { select: { name: true } },
} as const;
