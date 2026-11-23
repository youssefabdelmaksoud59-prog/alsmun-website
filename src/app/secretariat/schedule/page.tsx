import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ScheduleForm, ScheduleRow } from "@/components/secretariat/schedule";
import { DEFAULT_TZ, dayKey, formatDay, formatTime, utcToZonedInput } from "@/lib/time";

export const metadata: Metadata = { title: "Manage schedule" };

export default async function ManageSchedulePage() {
  const [items, committees] = await Promise.all([
    db.scheduleItem.findMany({ orderBy: [{ startsAt: "asc" }, { title: "asc" }], include: { committee: { select: { code: true } } } }),
    db.committee.findMany({ orderBy: [{ sortOrder: "asc" }, { code: "asc" }], select: { id: true, code: true } }),
  ]);
  const days = new Map<string, typeof items>();
  for (const it of items) days.set(dayKey(it.startsAt), [...(days.get(dayKey(it.startsAt)) ?? []), it]);
  const last = items[items.length - 1];
  const defaultStart = last ? utcToZonedInput(last.endsAt ?? last.startsAt) : undefined;
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        <p className="text-sm text-slate-500">Times are in the conference time zone ({DEFAULT_TZ}).</p>
        {items.length === 0 && <div className="card card-pad text-sm text-slate-500">No schedule items yet. Add the first one on the right.</div>}
        {[...days.entries()].map(([k, list]) => (
          <section key={k} className="card overflow-hidden" aria-label={formatDay(list[0].startsAt)}>
            <h2 className="border-b border-slate-100 px-4 py-2.5 text-sm font-bold">{formatDay(list[0].startsAt)}</h2>
            <ul className="divide-y divide-slate-100">
              {list.map((s) => (
                <ScheduleRow key={s.id} committees={committees}
                  when={`${formatTime(s.startsAt)}${s.endsAt ? `–${formatTime(s.endsAt)}` : ""}`}
                  forLabel={s.committee?.code ?? "All delegates"}
                  item={{ id: s.id, title: s.title, description: s.description, location: s.location, committeeId: s.committeeId, startsAt: utcToZonedInput(s.startsAt), endsAt: s.endsAt ? utcToZonedInput(s.endsAt) : "" }} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="card card-pad h-fit lg:sticky lg:top-24">
        <h2 className="mb-3 text-base font-bold">Add to schedule</h2>
        <ScheduleForm committees={committees} defaultStart={defaultStart} />
      </div>
    </div>
  );
}
