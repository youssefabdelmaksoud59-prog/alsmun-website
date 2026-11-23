import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Secretariat" };

export default async function SecretariatHome() {
  const [committees, users, schedule] = await Promise.all([
    db.committee.findMany({
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      include: {
        chairs: { where: { active: true }, select: { name: true } },
        _count: {
          select: {
            delegations: true,
            reports: true,
            resolutions: true,
            amendments: true,
            attendanceSessions: true,
          },
        },
      },
    }),
    db.user.count({ where: { active: true } }),
    db.scheduleItem.count(),
  ]);
  const pending = await Promise.all(
    committees.map(async (c) => ({
      id: c.id,
      r: await db.resolution.count({ where: { committeeId: c.id, status: "PENDING" } }),
      a: await db.amendment.count({ where: { committeeId: c.id, status: "PENDING" } }),
    })),
  );
  const pendingBy = new Map(pending.map((p) => [p.id, p]));
  const setupIssues = committees.filter((c) => c.chairs.length === 0 || c._count.delegations === 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Committees" value={committees.length} href="/secretariat/committees" />
        <Stat label="Active staff accounts" value={users} href="/secretariat/users" />
        <Stat label="Schedule items" value={schedule} href="/secretariat/schedule" />
        <Stat label="Waiting for review" value={pending.reduce((s, p) => s + p.r + p.a, 0)} href="/chair" />
      </div>

      {setupIssues.length > 0 && (
        <div className="rounded-xl border border-gold-300 bg-gold-50 px-4 py-3 text-sm text-navy-950">
          <strong>Setup to finish:</strong>{" "}
          {setupIssues.map((c) => `${c.code} (${[c.chairs.length === 0 && "no chair", c._count.delegations === 0 && "no delegations"].filter(Boolean).join(", ")})`).join(" · ")}
        </div>
      )}

      <div className="table-wrap">
        <table className="table">
          <caption className="sr-only">Committees overview</caption>
          <thead>
            <tr>
              <th scope="col">Committee</th>
              <th scope="col">Chairs</th>
              <th scope="col" className="text-right">Delegations</th>
              <th scope="col" className="text-right">Resolutions</th>
              <th scope="col" className="text-right">Amendments</th>
              <th scope="col" className="text-right">To review</th>
              <th scope="col" className="text-right">Reports</th>
              <th scope="col"><span className="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody>
            {committees.map((c) => {
              const p = pendingBy.get(c.id)!;
              return (
                <tr key={c.id}>
                  <td><span className="font-bold text-navy-950">{c.code}</span><span className="block text-xs text-slate-500">{c.name}</span></td>
                  <td className="text-sm">{c.chairs.length ? c.chairs.map((x) => x.name).join(", ") : <span className="text-amber-700">None yet</span>}</td>
                  <td className="text-right tabular-nums">{c._count.delegations}</td>
                  <td className="text-right tabular-nums">{c._count.resolutions}</td>
                  <td className="text-right tabular-nums">{c._count.amendments}</td>
                  <td className="text-right tabular-nums">{p.r + p.a > 0 ? <span className="badge-pending">{p.r + p.a}</span> : "0"}</td>
                  <td className="text-right tabular-nums">{c._count.reports}</td>
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

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card p-4 hover:border-navy-300">
      <div className="text-3xl font-bold tabular-nums text-navy-950">{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
    </Link>
  );
}
