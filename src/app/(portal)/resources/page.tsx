import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { AmendmentGuide, ResolutionGuide } from "@/components/thimun-guide";
import { GLOSSARY, RULES, type GlossaryEntry } from "@/lib/resources";

export const metadata: Metadata = { title: "Resources" };

const SECTIONS = [
  { id: "rules", label: "Rules of procedure" },
  { id: "points-and-motions", label: "Points & motions" },
  { id: "thimun-guide", label: "THIMUN guide" },
];

const KIND_STYLE: Record<GlossaryEntry["kind"], string> = {
  Point: "bg-navy-50 text-navy-800 ring-navy-200",
  Motion: "bg-gold-50 text-gold-800 ring-gold-300",
  Term: "bg-slate-100 text-slate-700 ring-slate-200",
};

export default function ResourcesPage() {
  const groups: { kind: GlossaryEntry["kind"]; title: string }[] = [
    { kind: "Point", title: "Points" },
    { kind: "Motion", title: "Motions" },
    { kind: "Term", title: "Other terms" },
  ];
  return (
    <div className="container-page">
      <PageHeader eyebrow="Delegates" title="Resources" description="The rules of procedure, what each point and motion means, and how to write resolutions and amendments, all in one place." />

      <nav aria-label="On this page" className="sticky top-16 z-10 -mx-4 mb-8 overflow-x-auto border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-2">
        <ul className="flex w-max gap-1 py-2">
          {SECTIONS.map((s) => (
            <li key={s.id}><a href={`#${s.id}`} className="inline-block whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold text-navy-800 hover:bg-navy-50">{s.label}</a></li>
          ))}
        </ul>
      </nav>

      <section id="rules" className="scroll-mt-32" aria-labelledby="rules-h">
        <h2 id="rules-h" className="mb-1 text-xl font-bold">Rules of procedure</h2>
        <p className="mb-5 text-sm text-slate-500">A summary of the THIMUN procedure used at the conference. Your chairs may adapt it, and their ruling is final.</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {RULES.map((r, i) => (
            <article key={r.title} className="card card-pad">
              <h3 className="mb-2 flex items-center gap-2 font-bold text-navy-950">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs text-gold-300">{i + 1}</span>
                {r.title}
              </h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
                {r.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="points-and-motions" className="mt-12 scroll-mt-32" aria-labelledby="pm-h">
        <h2 id="pm-h" className="mb-1 text-xl font-bold">Points &amp; motions</h2>
        <p className="mb-5 text-sm text-slate-500">Raise your placard and wait to be recognised. Only a point of personal privilege about audibility may interrupt a speaker.</p>
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.kind}>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{g.title}</h3>
              <dl className="card divide-y divide-slate-100">
                {GLOSSARY.filter((e) => e.kind === g.kind).map((e) => (
                  <div key={e.term} className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[260px_minmax(0,1fr)] sm:gap-4">
                    <dt className="font-semibold text-navy-950">
                      {e.term}
                      <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${KIND_STYLE[e.kind]}`}>{e.kind}</span>
                        {e.interrupt && <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700 ring-1 ring-inset ring-red-200">Can interrupt</span>}
                      </span>
                    </dt>
                    <dd className="text-sm leading-relaxed text-slate-700">
                      {e.text}
                      {e.example && <span className="mt-1 block italic text-slate-500">{e.example}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section id="thimun-guide" className="mt-12 scroll-mt-32" aria-labelledby="guide-h">
        <h2 id="guide-h" className="mb-1 text-xl font-bold">THIMUN guide</h2>
        <p className="mb-5 text-sm text-slate-500">How to write resolutions and amendments the way your chairs expect them.</p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="card card-pad" aria-labelledby="g-res">
            <h3 id="g-res" className="mb-4 text-lg font-bold">Resolutions</h3>
            <ResolutionGuide />
          </article>
          <article className="card card-pad" aria-labelledby="g-am">
            <h3 id="g-am" className="mb-4 text-lg font-bold">Amendments</h3>
            <AmendmentGuide />
          </article>
        </div>
        <p className="mt-5 text-sm text-slate-500">Ready to submit? <Link href="/delegate" className="font-semibold text-navy-700 hover:underline">Choose your committee</Link> and use the submit pages.</p>
      </section>
    </div>
  );
}
