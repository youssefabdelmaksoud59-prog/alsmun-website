import { requireCommitteeAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { issueInclude, strikeCounts } from "@/lib/issues";
import { toIssueView } from "@/lib/issue-view";
import { IssueForm } from "@/components/issues/issue-form";
import { IssueCard } from "@/components/issues/issue-card";
import { StrikeSummary } from "@/components/issues/strike-summary";

export default async function ChairIssuesPage({ params }: { params: Promise<{ code: string }> }) {
  const { committee } = await requireCommitteeAccess((await params).code);
  const [issues, delegations, strikes] = await Promise.all([
    db.issue.findMany({ where: { committeeId: committee.id }, orderBy: [{ status: "asc" }, { createdAt: "desc" }], include: issueInclude }),
    db.delegation.findMany({ where: { committeeId: committee.id }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    strikeCounts(committee.id),
  ]);
  const strikeMap = new Map(strikes.map((s) => [s.delegationId, s.count]));
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <StrikeSummary rows={strikes} />
        <section className="card overflow-hidden" aria-labelledby="issues-h">
          <h2 id="issues-h" className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Reports from {committee.code}</h2>
          {issues.length === 0 ? (
            <p className="px-4 py-4 text-sm text-slate-500">Nothing reported yet. Strikes and missing equipment you report go straight to the secretariat.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {issues.map((i) => <IssueCard key={i.id} issue={toIssueView(i, strikeMap)} />)}
            </ul>
          )}
        </section>
      </div>
      <div className="card card-pad h-fit lg:sticky lg:top-24">
        <IssueForm fixedCommittee committees={[{ id: committee.id, code: committee.code, delegations }]} />
      </div>
    </div>
  );
}
