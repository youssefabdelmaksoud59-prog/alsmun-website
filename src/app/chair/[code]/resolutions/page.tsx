import { requireCommitteeAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolutionRef } from "@/lib/codes";
import { ResolutionDocument } from "@/components/resolution-document";
import { ReviewActions } from "@/components/chair/review-actions";
import { StatusTabs, parseStatusTab, statusWhere } from "@/components/chair/status-tabs";
import { EmptyState, StatusBadge } from "@/components/ui";
import { AutoRefresh } from "@/components/auto-refresh";

import { formatDateTime } from "@/lib/time";
import { checkResolution, splitClauses } from "@/lib/thimun";

export default async function ChairResolutions({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ status?: string }> }) {
  const { committee } = await requireCommitteeAccess((await params).code);
  const tab = parseStatusTab((await searchParams).status);
  const where = { committeeId: committee.id };
  const [items, grouped, chosen] = await Promise.all([
    db.resolution.findMany({
      where: { ...where, ...statusWhere(tab) },
      orderBy: tab === "pending" ? { createdAt: "asc" } : { createdAt: "desc" },
      include: { delegation: { select: { name: true } }, _count: { select: { amendments: true } } },
    }),
    db.resolution.groupBy({ by: ["status"], where, _count: true }),
    db.resolution.count({ where: { ...where, chosen: true } }),
  ]);
  const count = (s: string) => grouped.find((g) => g.status === s)?._count ?? 0;
  const base = `/chair/${encodeURIComponent(committee.code)}/resolutions`;
  return (
    <div>
      <AutoRefresh seconds={30} />
      <StatusTabs base={base} active={tab} counts={{ pending: count("PENDING"), approved: count("APPROVED"), chosen, rejected: count("REJECTED") }} />
      {items.length === 0 ? (
        <EmptyState title={tab === "pending" ? "Nothing to review" : "No resolutions here"}>
          {tab === "pending" ? "New resolutions from delegates will appear here automatically." : "Try another tab."}
        </EmptyState>
      ) : (
        <div className="grid gap-4">
          {items.map((r, idx) => {
            const issues = checkResolution(splitClauses(r.preambulatory), splitClauses(r.operative));
            return (
              <article key={r.id} className="card overflow-hidden" data-testid="chair-resolution">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
                  <div>
                    <span className="font-mono text-sm font-bold text-navy-900">{resolutionRef(committee.code, r.number)}</span>
                    <span className="ml-2 text-sm text-slate-600">{r.delegation.name}{r.topic ? ` · ${r.topic}` : ""}</span>
                  </div>
                  <StatusBadge status={r.status} chosen={r.chosen} />
                </div>
                <div className="space-y-3 px-5 py-4">
                  <details open={tab === "pending" && idx === 0}>
                    <summary className="cursor-pointer text-sm font-semibold text-navy-700">
                      Read resolution ({splitClauses(r.preambulatory).length} preambulatory, {splitClauses(r.operative).length} operative clauses)
                    </summary>
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                      <ResolutionDocument committeeName={committee.name} topic={r.topic} submitter={r.delegation.name} coSubmitters={r.coSubmitters} preambulatory={r.preambulatory} operative={r.operative} />
                    </div>
                  </details>
                  {issues.length > 0 && (
                    <p className="text-xs text-amber-700">Format check found {issues.length} issue{issues.length === 1 ? "" : "s"}: {issues.slice(0, 2).map((i) => i.message).join(" ")}</p>
                  )}
                  <p className="text-xs text-slate-500">Submitted {formatDateTime(r.createdAt)} · {r._count.amendments} amendment{r._count.amendments === 1 ? "" : "s"}</p>
                  <ReviewActions kind="resolution" id={r.id} status={r.status} chosen={r.chosen} note={r.chairNote} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
