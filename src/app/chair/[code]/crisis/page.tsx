import { requireCommitteeAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { CrisisFeed } from "@/components/crisis-feed";
import { AutoRefresh } from "@/components/auto-refresh";

export default async function ChairCrisisPage({ params }: { params: Promise<{ code: string }> }) {
  const { committee } = await requireCommitteeAccess((await params).code);
  const items = await db.crisisUpdate.findMany({ where: { committeeId: committee.id }, orderBy: { publishAt: "desc" } });
  return (
    <div className="max-w-3xl">
      <AutoRefresh seconds={15} />
      <p className="mb-4 text-sm text-slate-500">The secretariat posts crisis news here. Scheduled updates are shown to you in advance; delegates only see them once their time comes.</p>
      <CrisisFeed items={items} empty="The secretariat hasn’t posted any crisis updates for this committee." />
    </div>
  );
}
