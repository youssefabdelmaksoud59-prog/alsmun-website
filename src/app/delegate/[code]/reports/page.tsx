import type { Metadata } from "next";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getCommitteeByCode } from "@/lib/settings";
import { EmptyState, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/time";
import { formatBytes } from "@/lib/format";

export const metadata: Metadata = { title: "Chair reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage({ params }: { params: Promise<{ code: string }> }) {
  const active = await getCommitteeByCode((await params).code);
  if (!active) notFound();
  const reports = await db.chairReport.findMany({
    where: { committeeId: active.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, fileName: true, size: true, createdAt: true, committee: { select: { code: true, name: true } } },
  });
  return (
    <div className="container-page max-w-4xl">
      <PageHeader eyebrow={active.code} title="Chair reports" description="Reports and study guides from your chairs. Tap one to download it." />
      {reports.length === 0 ? (
        <EmptyState title="No chair reports yet">Your chairs haven’t uploaded any reports for {active.code} yet.</EmptyState>
      ) : (
        <ul className="card divide-y divide-slate-100">
          {reports.map((r) => (
            <li key={r.id}>
              <a href={`/api/reports/${r.id}`} className="flex items-center gap-4 px-4 py-4 transition hover:bg-slate-50 sm:px-5" download={r.fileName}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-[11px] font-bold uppercase text-gold-300" aria-hidden>
                  {r.fileName.split(".").pop()?.slice(0, 4) || "file"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-navy-950">{r.title}</span>
                  <span className="block text-xs text-slate-500">{formatBytes(r.size)} · {formatDateTime(r.createdAt)}</span>
                </span>
                <span className="btn-outline btn-sm">Download</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
