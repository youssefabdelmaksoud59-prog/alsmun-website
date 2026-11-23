import { requireCommitteeAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { AddDelegationsForm, DelegationRow, TopicsForm } from "@/components/chair/setup-forms";

export default async function SetupPage({ params }: { params: Promise<{ code: string }> }) {
  const { committee } = await requireCommitteeAccess((await params).code);
  const delegations = await db.delegation.findMany({
    where: { committeeId: committee.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { resolutions: true, amendments: true, scoreEvents: true } } },
  });
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="card overflow-hidden" aria-labelledby="roster-h">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 id="roster-h" className="font-bold">Roster</h2>
          <span className="badge-neutral">{delegations.length} delegations</span>
        </div>
        {delegations.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">No delegations yet. Until you add some, delegates can type their delegation name when submitting.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {delegations.map((d) => (
              <DelegationRow key={d.id} id={d.id} name={d.name} locked={d._count.resolutions + d._count.amendments + d._count.scoreEvents > 0} />
            ))}
          </ul>
        )}
      </section>
      <div className="space-y-6">
        <div className="card card-pad"><AddDelegationsForm committeeId={committee.id} /></div>
        <div className="card card-pad"><TopicsForm committeeId={committee.id} topics={committee.topics} /></div>
      </div>
    </div>
  );
}
