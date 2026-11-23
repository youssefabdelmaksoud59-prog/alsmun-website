import { requireCommitteeAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { DeleteReportButton, UploadReportForm } from "@/components/chair/report-forms";
import { formatBytes } from "@/lib/format";
import { formatDateTime } from "@/lib/time";

export default async function ChairReportsPage({ params }: { params: Promise<{ code: string }> }) {
  const { committee } = await requireCommitteeAccess((await params).code);
  const reports = await db.chairReport.findMany({
    where: { committeeId: committee.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, fileName: true, size: true, createdAt: true, uploadedBy: { select: { name: true } } },
  });
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="card overflow-hidden" aria-labelledby="reports-h">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 id="reports-h" className="font-bold">Published reports</h2>
          <p className="text-xs text-slate-500">Delegates can download these from the Chair reports page.</p>
        </div>
        {reports.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">No reports uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <a href={`/api/reports/${r.id}`} className="font-semibold text-navy-900 hover:underline">{r.title}</a>
                  <p className="text-xs text-slate-500">{r.fileName} · {formatBytes(r.size)} · {formatDateTime(r.createdAt)}{r.uploadedBy ? ` · ${r.uploadedBy.name}` : ""}</p>
                </div>
                <DeleteReportButton id={r.id} title={r.title} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="card card-pad h-fit"><UploadReportForm committeeId={committee.id} /></div>
    </div>
  );
}
