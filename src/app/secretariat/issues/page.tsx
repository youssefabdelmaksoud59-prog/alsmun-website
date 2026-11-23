import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { db } from "@/lib/db";
import { issueInclude, strikeCounts } from "@/lib/issues";
import { toIssueView } from "@/lib/issue-view";
import { IssueForm } from "@/components/issues/issue-form";
import { IssueCard } from "@/components/issues/issue-card";
import { StrikeSummary } from "@/components/issues/strike-summary";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata: Metadata = { title: "Problems" };

const FILTERS = [
  { key: "open", label: "Open" },
  { key: "strikes", label: "Strikes" },
  { key: "equipment", label: "Equipment" },
  { key: "resolved", label: "Resolved" },
  { key: "all", label: "All" },
] as const;

export default async function SecretariatIssues({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const requested = (await searchParams).show;
  const show = FILTERS.find((f) => f.key === requested)?.key ?? "open";
  const where =
    show === "open" ? { status: "OPEN" as const }
    : show === "resolved" ? { status: "RESOLVED" as const }
    : show === "strikes" ? { kind: "STRIKE" as const }
    : show === "equipment" ? { kind: "EQUIPMENT" as const }
    : {};
  const [issues, strikes, committees] = await Promise.all([
    db.issue.findMany({ where, orderBy: { createdAt: "desc" }, include: issueInclude, take: 300 }),
    strikeCounts(),
    db.committee.findMany({
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      select: { id: true, code: true, delegations: { orderBy: { name: "asc" }, select: { id: true, name: true } } },
    }),
  ]);
  const strikeMap = new Map(strikes.map((s) => [s.delegationId, s.count]));
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <AutoRefresh seconds={20} />
      <div className="space-y-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-1 rounded-xl bg-slate-200/70 p-1">
            {FILTERS.map((f) => (
              <Link key={f.key} href={`/secretariat/issues?show=${f.key}`} scroll={false}
                className={clsx("whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold", show === f.key ? "bg-white text-navy-950 shadow" : "text-slate-600 hover:text-navy-900")}>
                {f.label}
              </Link>
            ))}
          </div>
        </div>
        <section className="card overflow-hidden" aria-label="Reported problems">
          {issues.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">{show === "open" ? "No open problems. All clear." : "Nothing here."}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {issues.map((i) => <IssueCard key={i.id} issue={toIssueView(i, strikeMap)} showCommittee />)}
            </ul>
          )}
        </section>
        <StrikeSummary rows={strikes} showCommittee />
      </div>
      <div className="card card-pad h-fit lg:sticky lg:top-24">
        <IssueForm committees={committees} />
      </div>
    </div>
  );
}
