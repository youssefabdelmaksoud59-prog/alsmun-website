import type { Metadata } from "next";
import { db } from "@/lib/db";
import { AnnouncementForm, CrisisForm, DeleteBroadcastButton } from "@/components/secretariat/broadcast";
import { formatDateTime, utcToZonedInput } from "@/lib/time";

export const metadata: Metadata = { title: "Announcements & crisis" };
export const dynamic = "force-dynamic";

export default async function BroadcastPage() {
  const [announcements, crisis, committees] = await Promise.all([
    db.announcement.findMany({ orderBy: { createdAt: "desc" } }),
    db.crisisUpdate.findMany({ orderBy: { publishAt: "desc" }, include: { committee: { select: { code: true } } } }),
    db.committee.findMany({ orderBy: [{ sortOrder: "asc" }, { code: "asc" }], select: { id: true, code: true, name: true } }),
  ]);
  const now = Date.now();
  const defaultAt = utcToZonedInput(new Date(Math.ceil((now + 10 * 60_000) / 300_000) * 300_000));
  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]" aria-labelledby="ann-h">
        <div className="card h-fit overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 id="ann-h" className="font-bold">Announcements</h2>
            <p className="text-xs text-slate-500">Urgent notices such as room changes or delays. The newest three show at the top of every committee’s pages, for delegates and chairs. Delete one when it no longer applies.</p>
          </div>
          {announcements.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">No announcements right now.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {announcements.map((a, i) => (
                <li key={a.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy-950">{a.title} {i >= 3 && <span className="badge-neutral ml-1 align-middle">Not shown, only the newest 3 are</span>}</p>
                    {a.body && <p className="whitespace-pre-line text-sm text-slate-600">{a.body}</p>}
                    <p className="text-xs text-slate-500">{formatDateTime(a.createdAt)}</p>
                  </div>
                  <DeleteBroadcastButton kind="announcement" id={a.id} label={a.title} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card card-pad h-fit">
          <h2 className="mb-3 text-base font-bold">New announcement</h2>
          <AnnouncementForm />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]" aria-labelledby="crisis-h">
        <div className="card h-fit overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 id="crisis-h" className="font-bold">Crisis updates</h2>
            <p className="text-xs text-slate-500">News for one committee, for crisis-style committees such as SC or ICJ. Scheduled updates stay hidden from delegates until their time; that committee’s chairs can see them in advance.</p>
          </div>
          {crisis.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">No crisis updates yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {crisis.map((u) => {
                const scheduled = u.publishAt.getTime() > now;
                return (
                  <li key={u.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3" data-testid="crisis-row">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-navy-900 px-1.5 py-0.5 text-xs font-bold text-gold-300">{u.committee.code}</span>
                        <span className="font-semibold text-navy-950">{u.title}</span>
                      </p>
                      <p className="line-clamp-2 text-sm text-slate-600">{u.body}</p>
                      <p className="text-xs">{scheduled
                        ? <span className="font-semibold text-amber-700">Scheduled for {formatDateTime(u.publishAt)}</span>
                        : <span className="text-slate-500">Published {formatDateTime(u.publishAt)}</span>}</p>
                    </div>
                    <DeleteBroadcastButton kind="crisis" id={u.id} label={u.title} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="card card-pad h-fit">
          <h2 className="mb-3 text-base font-bold">New crisis update</h2>
          <CrisisForm committees={committees} defaultAt={defaultAt} />
        </div>
      </section>
    </div>
  );
}
