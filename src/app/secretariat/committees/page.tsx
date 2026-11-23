import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CommitteeForm, CommitteeRow } from "@/components/secretariat/committees";

export const metadata: Metadata = { title: "Committees" };

export default async function CommitteesPage() {
  const committees = await db.committee.findMany({
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    include: { _count: { select: { delegations: true, chairs: true } } },
  });
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="card overflow-hidden" aria-label="Committees">
        <ul className="divide-y divide-slate-100">
          {committees.map((c) => (
            <CommitteeRow key={c.id} committee={{ id: c.id, code: c.code, name: c.name, topics: c.topics, sortOrder: c.sortOrder }}
              counts={`${c._count.delegations} delegations · ${c._count.chairs} chair account(s)`} />
          ))}
          {committees.length === 0 && <li className="px-4 py-6 text-sm text-slate-500">No committees yet.</li>}
        </ul>
      </section>
      <div className="card card-pad h-fit">
        <h2 className="mb-3 text-base font-bold">Add a committee</h2>
        <CommitteeForm />
      </div>
    </div>
  );
}
