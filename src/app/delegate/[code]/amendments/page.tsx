import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { delegateBase, getCommitteeByCode } from "@/lib/settings";
import { EmptyState, PageHeader } from "@/components/ui";
import { AmendmentCard } from "@/components/amendment-card";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata: Metadata = { title: "Amendments" };
export const dynamic = "force-dynamic";

export default async function AmendmentsPage({ params }: { params: Promise<{ code: string }> }) {
  const committee = await getCommitteeByCode((await params).code);
  if (!committee) notFound();
  const amendments = await db.amendment.findMany({
    where: { status: "APPROVED", committeeId: committee.id },
    orderBy: [{ chosen: "desc" }, { createdAt: "desc" }],
    include: { committee: { select: { code: true } }, delegation: { select: { name: true } }, resolution: { select: { number: true } } },
    take: 300,
  });
  return (
    <div className="container-page">
      <AutoRefresh />
      <PageHeader
        eyebrow={committee.code}
        title="Amendments"
        description="Amendments appear here once a chair approves them. Those chosen for debate are listed first."
        actions={<Link href={`${delegateBase(committee.code)}/amendments/submit`} className="btn-gold">Submit an amendment</Link>}
      />
      {amendments.length === 0 ? (
        <EmptyState title="No approved amendments yet">When your chairs approve an amendment, it will show up here.</EmptyState>
      ) : (
        <div className="grid gap-4">
          {amendments.map((a) => <AmendmentCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  );
}
