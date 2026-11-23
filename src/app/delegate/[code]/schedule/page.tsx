import type { Metadata } from "next";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getCommitteeByCode } from "@/lib/settings";
import { EmptyState, PageHeader } from "@/components/ui";
import { dayKey, formatDay, formatTime } from "@/lib/time";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata: Metadata = { title: "Schedule" };
export const dynamic = "force-dynamic";

export default async function SchedulePage({ params }: { params: Promise<{ code: string }> }) {
  const active = await getCommitteeByCode((await params).code);
  if (!active) notFound();
  const items = await db.scheduleItem.findMany({
    where: { OR: [{ committeeId: null }, { committeeId: active.id }] },
    orderBy: [{ startsAt: "asc" }, { title: "asc" }],
    include: { committee: { select: { code: true } } },
  });
  const days = new Map<string, typeof items>();
  for (const it of items) {
    const k = dayKey(it.startsAt);
    days.set(k, [...(days.get(k) ?? []), it]);
  }
  const now = Date.now();

  return (
    <div className="container-page max-w-4xl">
      <AutoRefresh seconds={60} />
      <PageHeader eyebrow={active.code} title="Schedule" description={`Sessions for ${active.code} and events for all delegates.`} />
      {items.length === 0 ? (
        <EmptyState title="The schedule hasn't been published yet">Check back soon.</EmptyState>
      ) : (
        <div className="space-y-8">
          {[...days.entries()].map(([k, list]) => (
            <section key={k} aria-labelledby={`d-${k}`}>
              <h2 id={`d-${k}`} className="mb-3 font-display text-lg font-bold tracking-wide text-navy-900">{formatDay(list[0].startsAt)}</h2>
              <ol className="card divide-y divide-slate-100">
                {list.map((s) => {
                  const end = s.endsAt?.getTime() ?? s.startsAt.getTime() + 30 * 60 * 1000;
                  const live = s.startsAt.getTime() <= now && now < end;
                  const past = end <= now;
                  return (
                    <li key={s.id} className={`flex gap-4 px-4 py-4 sm:px-5 ${live ? "bg-gold-50" : ""} ${past ? "opacity-60" : ""}`}>
                      <div className="w-24 shrink-0 text-sm tabular-nums">
                        <div className="font-bold text-navy-900">{formatTime(s.startsAt)}</div>
                        {s.endsAt && <div className="text-slate-500">to {formatTime(s.endsAt)}</div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-navy-950">{s.title}</span>
                          {live && <span className="badge-chosen">Now</span>}
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-500">
                          <span className="font-semibold text-navy-700">{s.committee?.code ?? "All delegates"}</span>
                          {s.location && <span>{s.location}</span>}
                        </div>
                        {s.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{s.description}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
