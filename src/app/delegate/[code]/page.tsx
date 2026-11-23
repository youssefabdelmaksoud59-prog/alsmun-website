import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { delegateBase, getCommitteeByCode } from "@/lib/settings";
import { formatDay, formatTime } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  return { title: decodeURIComponent((await params).code) };
}

const ACTIONS = [
  { path: "/amendments/submit", title: "Submit an amendment", body: "Propose a change to a clause of the resolution on the floor.", icon: "M12 5v14M5 12h14", accent: true },
  { path: "/resolutions/submit", title: "Submit a resolution", body: "Send your draft resolution to your chairs for approval.", icon: "M7 3h7l5 5v13H7zM14 3v5h5", accent: true },
  { path: "/amendments", title: "View amendments", body: "Every amendment your chairs have approved.", icon: "M4 6h16M4 12h16M4 18h10" },
  { path: "/resolutions", title: "View resolutions", body: "Approved resolutions in THIMUN format.", icon: "M5 4h14v16H5zM9 8h6M9 12h6M9 16h3" },
  { path: "/schedule", title: "Schedule", body: "Your sessions, breaks and ceremonies.", icon: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4" },
  { path: "/reports", title: "Chair reports", body: "Download your chairs’ reports.", icon: "M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" },
];

export default async function DelegateHub({ params }: { params: Promise<{ code: string }> }) {
  const committee = await getCommitteeByCode((await params).code);
  if (!committee) notFound();
  const base = delegateBase(committee.code);
  const [upcoming, counts] = await Promise.all([
    db.scheduleItem.findMany({
      where: {
        AND: [
          { OR: [{ committeeId: null }, { committeeId: committee.id }] },
          { OR: [{ endsAt: { gte: new Date() } }, { endsAt: null, startsAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } }] },
        ],
      },
      orderBy: { startsAt: "asc" },
      take: 4,
    }),
    Promise.all([
      db.amendment.count({ where: { committeeId: committee.id, status: "APPROVED" } }),
      db.resolution.count({ where: { committeeId: committee.id, status: "APPROVED" } }),
      db.chairReport.count({ where: { committeeId: committee.id } }),
    ]),
  ]);
  const badge: Record<string, number> = { "/amendments": counts[0], "/resolutions": counts[1], "/reports": counts[2] };

  return (
    <div className="container-page">
      <div className="pb-6 pt-8 sm:pt-10">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-gold-600">Delegate portal</p>
        <h1 className="text-2xl font-bold sm:text-3xl">{committee.name}</h1>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIONS.map((a) => (
          <Link key={a.path} href={base + a.path} className="card group flex gap-4 p-5 transition hover:-translate-y-0.5 hover:border-navy-300 hover:shadow-lg">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${a.accent ? "bg-gold-400 text-navy-950" : "bg-navy-50 text-navy-700"}`} aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={a.icon} /></svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-semibold text-navy-950 group-hover:text-navy-700">
                {a.title}
                {badge[a.path] ? <span className="badge-neutral">{badge[a.path]}</span> : null}
              </span>
              <span className="mt-0.5 block text-sm text-slate-500">{a.body}</span>
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
        <Link href="/track" className="font-semibold text-navy-700 hover:underline">Check a submission with your tracking code</Link>
        <Link href="/guide" className="font-semibold text-navy-700 hover:underline">THIMUN format guide</Link>
      </div>

      <section className="mt-10 max-w-2xl" aria-labelledby="up-h">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="up-h" className="text-lg font-bold">Coming up</h2>
          <Link href={`${base}/schedule`} className="text-sm font-semibold text-navy-700 hover:underline">Full schedule</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="card px-4 py-6 text-sm text-slate-500">Nothing else scheduled.</div>
        ) : (
          <ol className="card divide-y divide-slate-100">
            {upcoming.map((s) => (
              <li key={s.id} className="flex gap-4 px-4 py-3">
                <div className="w-16 shrink-0 text-right">
                  <div className="text-sm font-bold tabular-nums text-navy-900">{formatTime(s.startsAt)}</div>
                  <div className="text-[11px] text-slate-500">{formatDay(s.startsAt).split(" ")[0]}</div>
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-navy-950">{s.title}</div>
                  {s.location && <div className="text-xs text-slate-500">{s.location}</div>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
