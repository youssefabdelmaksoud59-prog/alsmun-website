import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolutionRef } from "@/lib/codes";
import { ResolutionDocument } from "@/components/resolution-document";
import { AmendmentCard } from "@/components/amendment-card";
import { StatusBadge } from "@/components/ui";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

async function load(id: string) {
  return db.resolution.findFirst({
    where: { id, status: "APPROVED" },
    include: {
      committee: true,
      delegation: true,
      amendments: {
        where: { status: "APPROVED" },
        orderBy: [{ chosen: "desc" }, { number: "asc" }],
        include: { committee: { select: { code: true } }, delegation: { select: { name: true } }, resolution: { select: { number: true } } },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const r = await load((await params).id);
  return { title: r ? resolutionRef(r.committee.code, r.number) : "Resolution" };
}

export default async function ResolutionPage({ params }: { params: Promise<{ id: string }> }) {
  const r = await load((await params).id);
  if (!r) notFound();
  const ref = resolutionRef(r.committee.code, r.number);
  return (
    <div className="container-page max-w-4xl">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 pb-4 pt-8">
        <Link href={`/resolutions?committee=${encodeURIComponent(r.committee.code)}`} className="text-sm font-semibold text-navy-700 hover:underline">← {r.committee.code} resolutions</Link>
        <div className="flex gap-2">
          <PrintButton />
          <Link href={`/amendments/submit?committee=${encodeURIComponent(r.committee.code)}&resolution=${r.id}`} className="btn-gold btn-sm">Amend this resolution</Link>
        </div>
      </div>
      <div className="card card-pad">
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <h1 className="font-mono text-lg font-bold">{ref}</h1>
          <StatusBadge status={r.status} chosen={r.chosen} />
        </div>
        <ResolutionDocument
          committeeName={r.committee.name}
          topic={r.topic}
          submitter={r.delegation.name}
          coSubmitters={r.coSubmitters}
          preambulatory={r.preambulatory}
          operative={r.operative}
        />
      </div>
      <section className="no-print mt-8" aria-labelledby="am-h">
        <h2 id="am-h" className="mb-3 text-lg font-bold">Approved amendments ({r.amendments.length})</h2>
        {r.amendments.length === 0 ? (
          <p className="text-sm text-slate-500">No approved amendments to this resolution yet.</p>
        ) : (
          <div className="grid gap-4">{r.amendments.map((a) => <AmendmentCard key={a.id} a={a} />)}</div>
        )}
      </section>
    </div>
  );
}
