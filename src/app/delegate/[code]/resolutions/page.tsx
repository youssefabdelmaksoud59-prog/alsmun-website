import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { delegateBase, getCommitteeByCode } from "@/lib/settings";
import { resolutionRef } from "@/lib/codes";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { AutoRefresh } from "@/components/auto-refresh";
import { operativeClauses } from "@/lib/thimun";

export const metadata: Metadata = { title: "Resolutions" };
export const dynamic = "force-dynamic";

export default async function ResolutionsPage({ params }: { params: Promise<{ code: string }> }) {
  const committee = await getCommitteeByCode((await params).code);
  if (!committee) notFound();
  const base = delegateBase(committee.code);
  const resolutions = await db.resolution.findMany({
    where: { status: "APPROVED", committeeId: committee.id },
    orderBy: [{ chosen: "desc" }, { createdAt: "desc" }],
    include: { delegation: { select: { name: true } }, _count: { select: { amendments: { where: { status: "APPROVED" } } } } },
    take: 300,
  });
  return (
    <div className="container-page">
      <AutoRefresh seconds={45} />
      <PageHeader
        eyebrow={committee.code}
        title="Resolutions"
        description="Resolutions your chairs have approved. Open one to read it in full and see its amendments."
        actions={<Link href={`${base}/resolutions/submit`} className="btn-gold">Submit a resolution</Link>}
      />
      {resolutions.length === 0 ? (
        <EmptyState title="No approved resolutions yet">Approved resolutions will be listed here.</EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {resolutions.map((r) => (
            <li key={r.id}>
              <Link href={`${base}/resolutions/${r.id}`} className="card group flex h-full flex-col p-5 transition hover:border-navy-300 hover:shadow-lg">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-navy-900">{resolutionRef(committee.code, r.number)}</span>
                  <StatusBadge status={r.status} chosen={r.chosen} />
                </div>
                <h2 className="mt-2 font-semibold text-navy-950 group-hover:text-navy-700">{r.topic || "Untitled topic"}</h2>
                <p className="mt-1 text-sm text-slate-600">Submitted by <strong>{r.delegation.name}</strong>{r.coSubmitters ? `, with ${r.coSubmitters}` : ""}</p>
                <p className="mt-auto pt-3 text-xs text-slate-500">
                  {operativeClauses(r.operative).length} operative clauses · {r._count.amendments} approved amendment{r._count.amendments === 1 ? "" : "s"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
