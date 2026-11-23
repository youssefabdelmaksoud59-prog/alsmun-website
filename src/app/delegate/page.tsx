import type { Metadata } from "next";
import Link from "next/link";
import { getCommittees } from "@/lib/settings";
import { PageHeader } from "@/components/ui";
import { ContinueCommittee } from "@/components/portal/remember-committee";

export const metadata: Metadata = { title: "Choose your committee" };
export const dynamic = "force-dynamic";

export default async function DelegatePickCommittee() {
  const committees = await getCommittees();
  return (
    <div className="container-page max-w-4xl">
      <PageHeader eyebrow="Delegate" title="Which committee are you in?" description="Pick your committee to submit resolutions and amendments, see what your chairs approved, and find your schedule and chair reports." />
      <ContinueCommittee committees={committees.map((c) => ({ code: c.code, name: c.name }))} />
      {committees.length === 0 ? (
        <p className="card card-pad text-sm text-slate-500">Committees will appear here once the secretariat sets them up.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {committees.map((c) => (
            <li key={c.id}>
              <Link href={`/delegate/${encodeURIComponent(c.code)}`} className="card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:border-navy-300 hover:shadow-lg">
                <span className="inline-flex min-w-[5rem] justify-center rounded-lg bg-navy-900 px-2 py-2 text-sm font-bold tracking-wide text-gold-300">{c.code}</span>
                <span className="flex-1 font-semibold text-navy-950 group-hover:text-navy-700">{c.name}</span>
                <span aria-hidden className="text-slate-400 group-hover:text-navy-700">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
