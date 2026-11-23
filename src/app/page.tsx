import Link from "next/link";
import Image from "next/image";
import { getCommittees, getSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { formatDay, formatTime } from "@/lib/time";

export const dynamic = "force-dynamic";

const ACTIONS = [
  { href: "/amendments/submit", title: "Submit an amendment", body: "Propose a change to a clause of the resolution on the floor.", icon: "M12 5v14M5 12h14", accent: true },
  { href: "/resolutions/submit", title: "Submit a resolution", body: "Send your draft resolution to your chairs for approval.", icon: "M7 3h7l5 5v13H7zM14 3v5h5", accent: true },
  { href: "/amendments", title: "View amendments", body: "See every amendment your chairs have approved.", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/resolutions", title: "View resolutions", body: "Read approved resolutions in THIMUN format.", icon: "M5 4h14v16H5zM9 8h6M9 12h6M9 16h3" },
  { href: "/schedule", title: "Schedule", body: "Sessions, breaks and ceremonies, by day.", icon: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4" },
  { href: "/reports", title: "Chair reports", body: "Download your committee's chair reports.", icon: "M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" },
];

export default async function Home() {
  const [settings, committees, upcoming] = await Promise.all([
    getSettings(),
    getCommittees(),
    db.scheduleItem.findMany({
      where: { OR: [{ endsAt: { gte: new Date() } }, { endsAt: null, startsAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } }] },
      orderBy: { startsAt: "asc" },
      take: 4,
      include: { committee: true },
    }),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }} />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-gold-400/10 blur-3xl" aria-hidden />
        <div className="container-page relative flex flex-col items-center gap-8 py-14 text-center sm:py-20 md:flex-row md:text-left">
          <Image src="/logo.png" alt={`${settings.conferenceName} crest`} width={180} height={180} priority className="h-36 w-36 rounded-full shadow-2xl ring-4 ring-gold-400/80 sm:h-44 sm:w-44" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">Model United Nations</p>
            <h1 className="mt-2 font-display text-5xl font-bold tracking-wide text-white sm:text-6xl">
              {settings.conferenceName.split(" ").map((w, i) => (
                <span key={i} className={i > 0 ? "text-gold-300" : ""}>{i > 0 ? " " : ""}{w}</span>
              ))}
            </h1>
            <p className="mt-3 max-w-xl text-lg text-slate-300">{settings.tagline}</p>
            {(settings.dates || settings.venue) && (
              <p className="mt-3 text-sm font-medium text-gold-200">
                {[settings.dates, settings.venue].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link href="/amendments/submit" className="btn-gold">Submit an amendment</Link>
              <Link href="/resolutions/submit" className="btn border border-white/25 bg-white/5 text-white hover:bg-white/10">Submit a resolution</Link>
            </div>
          </div>
        </div>
      </section>

      {settings.announcement && (
        <div className="border-b border-gold-200 bg-gold-50">
          <div className="container-page flex items-start gap-3 py-3 text-sm text-navy-950">
            <span className="mt-0.5 inline-flex h-5 shrink-0 items-center rounded bg-gold-400 px-1.5 text-[11px] font-bold uppercase tracking-wide">Notice</span>
            <p className="whitespace-pre-line">{settings.announcement}</p>
          </div>
        </div>
      )}

      <section className="container-page py-10">
        <h2 className="sr-only">Delegate portal</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIONS.map((a) => (
            <Link key={a.href} href={a.href} className="card group flex gap-4 p-5 transition hover:-translate-y-0.5 hover:border-navy-300 hover:shadow-lg">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${a.accent ? "bg-gold-400 text-navy-950" : "bg-navy-50 text-navy-700"}`} aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={a.icon} /></svg>
              </span>
              <span>
                <span className="block font-semibold text-navy-950 group-hover:text-navy-700">{a.title}</span>
                <span className="mt-0.5 block text-sm text-slate-500">{a.body}</span>
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Submitted something? <Link href="/track" className="font-semibold text-navy-700 underline-offset-2 hover:underline">Check its status with your tracking code</Link>.
        </p>
      </section>

      <section className="container-page grid gap-6 pb-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Committees</h2>
          </div>
          {committees.length === 0 ? (
            <p className="text-sm text-slate-500">Committees will appear here once the secretariat sets them up.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {committees.map((c) => (
                <li key={c.id} className="card flex items-center gap-3 px-4 py-3">
                  <span className="inline-flex min-w-[4.25rem] justify-center rounded-md bg-navy-900 px-2 py-1 text-xs font-bold tracking-wide text-gold-300">{c.code}</span>
                  <span className="text-sm font-medium text-slate-700">{c.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Coming up</h2>
            <Link href="/schedule" className="text-sm font-semibold text-navy-700 hover:underline">Full schedule</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="card px-4 py-6 text-sm text-slate-500">Nothing scheduled yet.</div>
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
                    <div className="text-xs text-slate-500">{[s.committee?.code ?? "All delegates", s.location].filter(Boolean).join(" · ")}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </>
  );
}
