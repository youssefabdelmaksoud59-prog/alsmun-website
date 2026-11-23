import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCommittees } from "@/lib/settings";
import { CommitteeTabs, EmptyState, PageHeader } from "@/components/ui";
import { AmendmentCard } from "@/components/amendment-card";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata: Metadata = { title: "Amendments" };
export const dynamic = "force-dynamic";

export default async function AmendmentsPage({ searchParams }: { searchParams: Promise<{ committee?: string }> }) {
  const { committee: code } = await searchParams;
  const committees = await getCommittees();
  const active = committees.find((c) => c.code === code);
  const amendments = await db.amendment.findMany({
    where: { status: "APPROVED", ...(active ? { committeeId: active.id } : {}) },
    orderBy: [{ chosen: "desc" }, { createdAt: "desc" }],
    include: { committee: { select: { code: true } }, delegation: { select: { name: true } }, resolution: { select: { number: true } } },
    take: 300,
  });
  return (
    <div className="container-page">
      <AutoRefresh />
      <PageHeader
        eyebrow="Delegate portal"
        title="Amendments"
        description="Amendments appear here once a chair approves them. Those chosen for debate are listed first."
        actions={<Link href={`/amendments/submit${active ? `?committee=${encodeURIComponent(active.code)}` : ""}`} className="btn-gold">Submit an amendment</Link>}
      />
      <CommitteeTabs committees={committees} active={active?.code} basePath="/amendments" allLabel="All committees" />
      {amendments.length === 0 ? (
        <EmptyState title="No approved amendments yet">
          {active ? `When the ${active.code} chairs approve an amendment, it will show up here.` : "When chairs approve amendments, they will show up here."}
        </EmptyState>
      ) : (
        <div className="grid gap-4">
          {amendments.map((a) => <AmendmentCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  );
}
