import { db } from "./db";
import { resolutionRef } from "./codes";
import type { PortalCommittee } from "@/components/portal/types";

export function topicList(topics: string) {
  return topics.split("\n").map((t) => t.trim()).filter(Boolean);
}

export async function loadPortalCommittees(): Promise<PortalCommittee[]> {
  const committees = await db.committee.findMany({
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    include: {
      delegations: { orderBy: { name: "asc" }, select: { id: true, name: true } },
      resolutions: {
        where: { status: "APPROVED" },
        orderBy: { number: "asc" },
        select: { id: true, number: true, topic: true, chosen: true, delegation: { select: { name: true } } },
      },
    },
  });
  return committees.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    topics: topicList(c.topics),
    delegations: c.delegations,
    resolutions: c.resolutions.map((r) => ({
      id: r.id,
      label: `${resolutionRef(c.code, r.number)} · ${r.delegation.name}${r.topic ? ` · ${r.topic}` : ""}${r.chosen ? " (on the floor)" : ""}`,
    })),
  }));
}
