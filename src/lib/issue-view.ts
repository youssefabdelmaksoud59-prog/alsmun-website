import type { Issue } from "@prisma/client";
import { formatDateTime } from "./time";
import type { IssueView } from "@/components/issues/issue-card";

export function toIssueView(
  i: Issue & { committee: { code: string } | null; delegation: { name: string } | null },
  strikes?: Map<string, number>,
): IssueView {
  return {
    id: i.id,
    kind: i.kind,
    status: i.status,
    committee: i.committee?.code ?? null,
    delegation: i.delegation?.name ?? null,
    details: i.details,
    reportedBy: i.reportedBy,
    resolution: i.resolution,
    when: formatDateTime(i.createdAt),
    strikeCount: i.delegationId ? strikes?.get(i.delegationId) : undefined,
  };
}
