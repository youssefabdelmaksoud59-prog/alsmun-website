import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCommittees } from "@/lib/settings";
import { resolutionRef } from "@/lib/codes";
import { CommitteeTabs, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { AutoRefresh } from "@/components/auto-refresh";
import { splitClauses } from "@/lib/thimun";

export const metadata: Metadata = { title: "Resolutions" };
export const dynamic = "force-dynamic";

export default async function ResolutionsPage({ searchParams }: { searchParams: Promise<{ committee?: string }> }) {
  const { committee: code } = await searchParams;
  const committees = await getCommittees();
  const active = committees.find((c) => c.code === code);
  const resolutions = await db.resolution.findMany({
    where: { status: "APPROVED", ...(active ? { committeeId: active.id } : {}) },
    orderBy: [{ chosen: "desc" }, { createdAt: "desc" }],
    include: { committee: { select: { code: true, name: true } }, delegation: { select: { name: true } }, _count: { select: { amendments: { where: { status: "APPROVED" } } } } },
    take: 300,
  });
  return (
    <div className="container-page">
      <AutoRefresh seconds={45} />
      <PageHeader
        eyebrow="Delegate portal"
        title="Resolutions"
        description="Resolutions your chairs have approved. Open one to read it in full and see its amendments."
        actions={<Link href={`/resolutions/submit${active ? `?committee=${encodeURIComponent(active.code)}` : ""}`} className="btn-gold">Submit a resolution</Link>}
      />
      <CommitteeTabs committees={committees} active={active?.code} basePath="/resolutions" allLabel="All committees" />
      {resolutions.length === 0 ? (
        <EmptyState title="No approved resolutions yet">Approved resolutions will be listed here.</EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {resolutions.map((r) => (
            <li key={r.id}>
              <Link href={`/resolutions/${r.id}`} className="card group flex h-full flex-col p-5 transition hover:border-navy-300 hover:shadow-lg">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-navy-900">{resolutionRef(r.committee.code, r.number)}</span>
                  <StatusBadge status={r.status} chosen={r.chosen} />
                </div>
                <h2 className="mt-2 font-semibold text-navy-950 group-hover:text-navy-700">{r.topic || "Untitled topic"}</h2>
                <p className="mt-1 text-sm text-slate-600">Submitted by <strong>{r.delegation.name}</strong>{r.coSubmitters ? `, with ${r.coSubmitters}` : ""}</p>
                <p className="mt-auto pt-3 text-xs text-slate-500">
                  {splitClauses(r.operative).length} operative clauses · {r._count.amendments} approved amendment{r._count.amendments === 1 ? "" : "s"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
