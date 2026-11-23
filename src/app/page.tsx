import Link from "next/link";
import Image from "next/image";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const ROLES = [
  {
    href: "/delegate",
    title: "Delegate",
    body: "Pick your committee, then submit resolutions and amendments, see approved ones, your schedule and chair reports.",
    cta: "Choose your committee",
    icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
    gold: true,
  },
  {
    href: "/login/chair",
    title: "Chair",
    body: "Enter your chair code to review submissions, tally points, take attendance and report problems.",
    cta: "Enter chair code",
    icon: "M4 21V9l8-6 8 6v12M9 21v-6h6v6",
  },
  {
    href: "/login/secretariat",
    title: "Secretariat",
    body: "Enter the secretariat code to see strikes, missing equipment and every committee.",
    cta: "Enter secretariat code",
    icon: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z",
  },
];

export default async function Home() {
  const settings = await getSettings();
  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }} />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-gold-400/10 blur-3xl" aria-hidden />
        <div className="container-page relative flex flex-col items-center gap-6 pb-28 pt-12 text-center sm:pt-16">
          <Image src="/logo.png" alt={`${settings.conferenceName} crest`} width={160} height={160} priority className="h-32 w-32 rounded-full shadow-2xl ring-4 ring-gold-400/80 sm:h-40 sm:w-40" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">Model United Nations</p>
            <h1 className="mt-2 font-display text-5xl font-bold tracking-wide text-white sm:text-6xl">
              {settings.conferenceName.split(" ").map((w, i) => (
                <span key={i} className={i > 0 ? "text-gold-300" : ""}>{i > 0 ? " " : ""}{w}</span>
              ))}
            </h1>
            {(settings.dates || settings.venue) && (
              <p className="mt-3 text-sm font-medium text-gold-200">{[settings.dates, settings.venue].filter(Boolean).join(" · ")}</p>
            )}
            <p className="mt-6 text-xl font-semibold text-white">Are you a delegate, a chair or the secretariat?</p>
          </div>
        </div>
      </section>

      <section className="container-page relative -mt-20" aria-label="Choose your role">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {ROLES.map((r) => (
            <Link key={r.href} href={r.href} className={`card group flex flex-col p-6 transition hover:-translate-y-1 hover:shadow-xl ${r.gold ? "border-gold-400 ring-2 ring-gold-400" : "hover:border-navy-300"}`}>
              <span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${r.gold ? "bg-gold-400 text-navy-950" : "bg-navy-900 text-gold-300"}`} aria-hidden>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={r.icon} /></svg>
              </span>
              <span className="text-xl font-bold text-navy-950">{r.title}</span>
              <span className="mt-1 flex-1 text-sm text-slate-600">{r.body}</span>
              <span className={`mt-5 ${r.gold ? "btn-gold" : "btn-primary"} w-full`}>{r.cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      {settings.announcement && (
        <div className="container-page mt-8">
          <div className="flex items-start gap-3 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-navy-950">
            <span className="mt-0.5 inline-flex h-5 shrink-0 items-center rounded bg-gold-400 px-1.5 text-[11px] font-bold uppercase tracking-wide">Notice</span>
            <p className="whitespace-pre-line">{settings.announcement}</p>
          </div>
        </div>
      )}

      <p className="container-page mt-8 text-center text-sm text-slate-500">
        Submitted something? <Link href="/track" className="font-semibold text-navy-700 hover:underline">Check its status with your tracking code</Link>
        {" · "}
        <Link href="/resources" className="font-semibold text-navy-700 hover:underline">Rules, motions &amp; THIMUN guide</Link>
      </p>
    </>
  );
}
