import Link from "next/link";
import { requireCommitteeAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { getScoreSheet } from "@/lib/scoresheet";
import { amendmentRef, resolutionRef } from "@/lib/codes";
import { formatDateTime } from "@/lib/time";
import { StatusBadge } from "@/components/ui";
import { AutoRefresh } from "@/components/auto-refresh";

export default async function ChairOverview({ params }: { params: Promise<{ code: string }> }) {
  const { committee } = await requireCommitteeAccess((await params).code);
  const base = `/chair/${encodeURIComponent(committee.code)}`;
  const [pendingR, pendingA, chosenR, chosenA, delegations, sheet, recentR, recentA] = await Promise.all([
    db.resolution.count({ where: { committeeId: committee.id, status: "PENDING" } }),
    db.amendment.count({ where: { committeeId: committee.id, status: "PENDING" } }),
    db.resolution.count({ where: { committeeId: committee.id, chosen: true } }),
    db.amendment.count({ where: { committeeId: committee.id, chosen: true } }),
    db.delegation.count({ where: { committeeId: committee.id } }),
    getScoreSheet(committee.id),
    db.resolution.findMany({ where: { committeeId: committee.id }, orderBy: { createdAt: "desc" }, take: 5, include: { delegation: true } }),
    db.amendment.findMany({ where: { committeeId: committee.id }, orderBy: { createdAt: "desc" }, take: 5, include: { delegation: true } }),
  ]);
  const recent = [
    ...recentR.map((r) => ({ id: r.id, kind: "Resolution", ref: resolutionRef(committee.code, r.number), who: r.delegation.name, at: r.createdAt, status: r.status, chosen: r.chosen, href: `${base}/resolutions?status=${r.status.toLowerCase()}` })),
    ...recentA.map((a) => ({ id: a.id, kind: "Amendment", ref: amendmentRef(committee.code, a.number), who: a.delegation.name, at: a.createdAt, status: a.status, chosen: a.chosen, href: `${base}/amendments?status=${a.status.toLowerCase()}` })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 6);

  const stats = [
    { label: "Amendments to review", value: pendingA, href: `${base}/amendments`, warn: pendingA > 0 },
    { label: "Resolutions to review", value: pendingR, href: `${base}/resolutions`, warn: pendingR > 0 },
    { label: "Chosen for debate", value: chosenA + chosenR, href: `${base}/amendments?status=chosen` },
    { label: "Delegations", value: delegations, href: `${base}/setup` },
  ];

  return (
    <div className="space-y-8">
      <AutoRefresh seconds={20} />
      {delegations === 0 && (
        <div className="rounded-xl border border-gold-300 bg-gold-50 px-4 py-3 text-sm text-navy-950">
          <strong>First step:</strong> add your committee’s delegations so delegates can pick theirs when submitting, and so you can take attendance and tally points.{" "}
          <Link href={`${base}/setup`} className="font-semibold underline">Add delegations</Link>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`card p-4 transition hover:border-navy-300 ${s.warn ? "border-amber-300 bg-amber-50/60" : ""}`}>
            <div className="text-3xl font-bold tabular-nums text-navy-950">{s.value}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="font-bold">Leaderboard</h2>
            <Link href={`${base}/scores`} className="text-sm font-semibold text-navy-700 hover:underline">Score sheet</Link>
          </div>
          {sheet.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">Add delegations to start scoring.</p>
          ) : (
            <ol className="divide-y divide-slate-100">
              {sheet.slice(0, 6).map((r) => (
                <li key={r.delegationId} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${r.rank === 1 && r.total > 0 ? "bg-gold-400 text-navy-950" : "bg-slate-100 text-slate-600"}`}>{r.rank}</span>
                  <span className="flex-1 font-medium">{r.delegation}</span>
                  <span className="font-bold tabular-nums text-navy-900">{r.total} pts</span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="font-bold">Latest submissions</h2>
          </div>
          {recent.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">Nothing submitted yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link href={r.href} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="font-mono font-semibold text-navy-900">{r.ref}</span>
                      <span className="block truncate text-xs text-slate-500">{r.who} · {formatDateTime(r.at)}</span>
                    </span>
                    <StatusBadge status={r.status} chosen={r.chosen} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
