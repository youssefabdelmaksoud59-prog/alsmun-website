import { requireCommitteeAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { AmendmentCard } from "@/components/amendment-card";
import { ReviewActions } from "@/components/chair/review-actions";
import { StatusTabs, parseStatusTab, statusWhere } from "@/components/chair/status-tabs";
import { EmptyState } from "@/components/ui";
import { AutoRefresh } from "@/components/auto-refresh";
import { formatDateTime } from "@/lib/time";

export default async function ChairAmendments({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ status?: string }> }) {
  const { committee } = await requireCommitteeAccess((await params).code);
  const tab = parseStatusTab((await searchParams).status);
  const where = { committeeId: committee.id };
  const [items, grouped, chosen] = await Promise.all([
    db.amendment.findMany({
      where: { ...where, ...statusWhere(tab) },
      orderBy: tab === "pending" ? { createdAt: "asc" } : { createdAt: "desc" },
      include: { committee: { select: { code: true } }, delegation: { select: { name: true } }, resolution: { select: { number: true } } },
    }),
    db.amendment.groupBy({ by: ["status"], where, _count: true }),
    db.amendment.count({ where: { ...where, chosen: true } }),
  ]);
  const count = (s: string) => grouped.find((g) => g.status === s)?._count ?? 0;
  const base = `/chair/${encodeURIComponent(committee.code)}/amendments`;
  return (
    <div>
      <AutoRefresh seconds={20} />
      <StatusTabs base={base} active={tab} counts={{ pending: count("PENDING"), approved: count("APPROVED"), chosen, rejected: count("REJECTED") }} />
      {items.length === 0 ? (
        <EmptyState title={tab === "pending" ? "Nothing to review" : "No amendments here"}>
          {tab === "pending" ? "New amendments from delegates will appear here automatically." : "Try another tab."}
        </EmptyState>
      ) : (
        <div className="grid gap-4">
          {items.map((a) => (
            <AmendmentCard key={a.id} a={a}>
              {a.rationale && <p className="text-sm text-slate-600"><span className="font-semibold text-navy-900">Delegate’s reason: </span>{a.rationale}</p>}
              <p className="text-xs text-slate-500">Submitted {formatDateTime(a.createdAt)}</p>
              <ReviewActions kind="amendment" id={a.id} status={a.status} chosen={a.chosen} note={a.chairNote} />
            </AmendmentCard>
          ))}
        </div>
      )}
    </div>
  );
}
