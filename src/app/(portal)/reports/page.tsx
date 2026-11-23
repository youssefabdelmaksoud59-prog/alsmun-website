import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCommittees } from "@/lib/settings";
import { CommitteeTabs, EmptyState, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/time";
import { formatBytes } from "@/lib/format";

export const metadata: Metadata = { title: "Chair reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ committee?: string }> }) {
  const { committee: code } = await searchParams;
  const committees = await getCommittees();
  const active = committees.find((c) => c.code === code);
  const reports = await db.chairReport.findMany({
    where: active ? { committeeId: active.id } : {},
    orderBy: [{ committee: { sortOrder: "asc" } }, { createdAt: "desc" }],
    select: { id: true, title: true, fileName: true, size: true, createdAt: true, committee: { select: { code: true, name: true } } },
  });
  return (
    <div className="container-page max-w-4xl">
      <PageHeader eyebrow="Delegate portal" title="Chair reports" description="Reports and study guides from your chairs. Tap one to download it." />
      <CommitteeTabs committees={committees} active={active?.code} basePath="/reports" allLabel="All committees" />
      {reports.length === 0 ? (
        <EmptyState title="No chair reports yet">Your chairs haven’t uploaded any reports{active ? ` for ${active.code}` : ""} yet.</EmptyState>
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
                  <span className="block text-xs text-slate-500">{r.committee.code} · {formatBytes(r.size)} · {formatDateTime(r.createdAt)}</span>
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
