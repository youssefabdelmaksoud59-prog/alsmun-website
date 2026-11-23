import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCommitteeByCode } from "@/lib/settings";
import { publishedCrisis } from "@/lib/broadcast";
import { PageHeader } from "@/components/ui";
import { CrisisFeed } from "@/components/crisis-feed";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata: Metadata = { title: "Crisis updates" };
export const dynamic = "force-dynamic";

export default async function DelegateCrisisPage({ params }: { params: Promise<{ code: string }> }) {
  const committee = await getCommitteeByCode((await params).code);
  if (!committee) notFound();
  const items = await publishedCrisis(committee.id);
  return (
    <div className="container-page max-w-3xl">
      <AutoRefresh seconds={15} />
      <PageHeader eyebrow={committee.code} title="Crisis updates" description="News from the secretariat for your committee. New updates appear here automatically." />
      <CrisisFeed items={items} empty="No crisis updates yet." />
    </div>
  );
}
