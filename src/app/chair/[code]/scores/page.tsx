import { requireCommitteeAccess } from "@/lib/auth";
import { getScoreSheet } from "@/lib/scoresheet";
import { POINTS } from "@/lib/scoring";
import { EmptyState } from "@/components/ui";
import { PrintButton } from "@/components/print-button";
import { AutoRefresh } from "@/components/auto-refresh";

export default async function ScoresPage({ params }: { params: Promise<{ code: string }> }) {
  const { committee } = await requireCommitteeAccess((await params).code);
  const sheet = await getScoreSheet(committee.id);
  const api = `/api/scores/${encodeURIComponent(committee.code)}`;
  return (
    <div>
      <AutoRefresh seconds={30} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Running totals. POI {POINTS.POI} · Speech {POINTS.SPEECH} · Amendment chosen {POINTS.AMENDMENT} · Resolution chosen {POINTS.RESOLUTION}
        </p>
        <div className="no-print flex flex-wrap gap-2">
          <a href={`${api}/xlsx`} className="btn-primary btn-sm" download>Export Excel</a>
          <a href={`${api}/pdf`} className="btn-outline btn-sm" download>Export PDF</a>
          <PrintButton />
        </div>
      </div>
      {sheet.length === 0 ? (
        <EmptyState title="No delegations yet">Add delegations to build the score sheet.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table" data-testid="score-table">
            <caption className="sr-only">{committee.code} score sheet</caption>
            <thead>
              <tr>
                <th scope="col" className="w-12">Rank</th>
                <th scope="col">Delegation</th>
                <th scope="col" className="text-right">POIs</th>
                <th scope="col" className="text-right">Speeches</th>
                <th scope="col" className="text-right">Amendments</th>
                <th scope="col" className="text-right">Resolutions</th>
                <th scope="col" className="text-right">Attendance</th>
                <th scope="col" className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sheet.map((r) => (
                <tr key={r.delegationId} className={r.rank <= 3 && r.total > 0 ? "bg-gold-50/50" : ""}>
                  <td className="font-bold tabular-nums">{r.rank}</td>
                  <td className="font-medium">{r.delegation}</td>
                  <td className="text-right tabular-nums">{r.poi}</td>
                  <td className="text-right tabular-nums">{r.speech}</td>
                  <td className="text-right tabular-nums">{r.amendment}</td>
                  <td className="text-right tabular-nums">{r.resolution}</td>
                  <td className="text-right tabular-nums">{r.sessions ? `${r.attended}/${r.sessions}` : "—"}</td>
                  <td className="text-right text-base font-bold tabular-nums text-navy-900">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
