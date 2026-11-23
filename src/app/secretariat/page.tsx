import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { STRIKE_ALERT, issueInclude, strikeCounts } from "@/lib/issues";
import { toIssueView } from "@/lib/issue-view";
import { IssueCard } from "@/components/issues/issue-card";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata: Metadata = { title: "Secretariat" };

export default async function SecretariatHome() {
  const [committees, openIssues, openCount, strikes, schedule] = await Promise.all([
    db.committee.findMany({
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      include: {
        _count: {
          select: {
            delegations: true,
            reports: true,
            resolutions: true,
            amendments: true,
            issues: { where: { status: "OPEN" } },
          },
        },
      },
    }),
    db.issue.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" }, take: 8, include: issueInclude }),
    db.issue.count({ where: { status: "OPEN" } }),
    strikeCounts(),
    db.scheduleItem.count(),
  ]);
  const [pendingR, pendingA] = await Promise.all([
    db.resolution.groupBy({ by: ["committeeId"], where: { status: "PENDING" }, _count: true }),
    db.amendment.groupBy({ by: ["committeeId"], where: { status: "PENDING" }, _count: true }),
  ]);
  const pendingFor = (id: string) =>
    (pendingR.find((p) => p.committeeId === id)?._count ?? 0) + (pendingA.find((p) => p.committeeId === id)?._count ?? 0);
  const totalPending = committees.reduce((s, c) => s + pendingFor(c.id), 0);
  const strikeMap = new Map(strikes.map((s) => [s.delegationId, s.count]));
  const flagged = strikes.filter((s) => s.count >= STRIKE_ALERT);
  const setupIssues = committees.filter((c) => !c.chairCode || c._count.delegations === 0);

  return (
    <div className="space-y-6">
      <AutoRefresh seconds={20} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open problems" value={openCount} href="/secretariat/issues" alert={openCount > 0} />
        <Stat label="Strikes given" value={strikes.reduce((s, r) => s + r.count, 0)} href="/secretariat/issues?show=strikes" />
        <Stat label="Waiting for chairs" value={totalPending} href="/chair" />
        <Stat label="Schedule items" value={schedule} href="/secretariat/schedule" />
      </div>

      {flagged.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          <strong>{STRIKE_ALERT}+ strikes:</strong> {flagged.map((f) => `${f.name} (${f.committee}, ${f.count})`).join(" · ")}
        </div>
      )}

      <section className="card overflow-hidden" aria-labelledby="attn-h">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 id="attn-h" className="font-bold">Needs attention</h2>
          <Link href="/secretariat/issues" className="text-sm font-semibold text-navy-700 hover:underline">All problems</Link>
        </div>
        {openIssues.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">No open problems. Strikes and missing equipment reported by chairs will appear here.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {openIssues.map((i) => <IssueCard key={i.id} issue={toIssueView(i, strikeMap)} showCommittee />)}
          </ul>
        )}
      </section>

      {setupIssues.length > 0 && (
        <div className="rounded-xl border border-gold-300 bg-gold-50 px-4 py-3 text-sm text-navy-950">
          <strong>Setup to finish:</strong>{" "}
          {setupIssues.map((c) => `${c.code} (${[!c.chairCode && "no chair code", c._count.delegations === 0 && "no delegations"].filter(Boolean).join(", ")})`).join(" · ")}
          {" "}<Link href="/secretariat/codes" className="font-semibold underline">Set chair codes</Link>
        </div>
      )}

      <div className="table-wrap">
        <table className="table">
          <caption className="sr-only">Committees overview</caption>
          <thead>
            <tr>
              <th scope="col">Committee</th>
              <th scope="col">Chair code</th>
              <th scope="col" className="text-right">Delegations</th>
              <th scope="col" className="text-right">Resolutions</th>
              <th scope="col" className="text-right">Amendments</th>
              <th scope="col" className="text-right">To review</th>
              <th scope="col" className="text-right">Open problems</th>
              <th scope="col"><span className="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody>
            {committees.map((c) => {
              const p = pendingFor(c.id);
              return (
                <tr key={c.id}>
                  <td><span className="font-bold text-navy-950">{c.code}</span><span className="block text-xs text-slate-500">{c.name}</span></td>
                  <td className="text-sm">{c.chairCode ? <span className="badge-approved">Set</span> : <span className="badge-pending">Missing</span>}</td>
                  <td className="text-right tabular-nums">{c._count.delegations}</td>
                  <td className="text-right tabular-nums">{c._count.resolutions}</td>
                  <td className="text-right tabular-nums">{c._count.amendments}</td>
                  <td className="text-right tabular-nums">{p > 0 ? <span className="badge-pending">{p}</span> : "0"}</td>
                  <td className="text-right tabular-nums">{c._count.issues > 0 ? <span className="badge-rejected">{c._count.issues}</span> : "0"}</td>
                  <td className="text-right"><Link href={`/chair/${encodeURIComponent(c.code)}`} className="btn-outline btn-sm">Open</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, href, alert }: { label: string; value: number; href: string; alert?: boolean }) {
  return (
    <Link href={href} className={`card p-4 hover:border-navy-300 ${alert ? "border-red-300 bg-red-50/60" : ""}`}>
      <div className={`text-3xl font-bold tabular-nums ${alert ? "text-red-700" : "text-navy-950"}`}>{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
    </Link>
  );
}
