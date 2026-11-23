import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommitteeByCode } from "@/lib/settings";
import { RememberCommittee } from "@/components/portal/remember-committee";
import { AnnouncementBanners, LatestCrisis } from "@/components/broadcast-banners";

export const dynamic = "force-dynamic";

export default async function DelegateCommitteeLayout({ children, params }: { children: React.ReactNode; params: Promise<{ code: string }> }) {
  const committee = await getCommitteeByCode((await params).code);
  if (!committee) notFound();
  return (
    <>
      <RememberCommittee code={committee.code} />
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page flex items-center justify-between gap-3 py-2.5 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <span className="rounded-md bg-navy-900 px-2 py-0.5 text-xs font-bold text-gold-300">{committee.code}</span>
            <span className="truncate font-medium text-navy-950">{committee.name}</span>
          </div>
          <Link href="/delegate" className="shrink-0 font-semibold text-navy-700 hover:underline">Change committee</Link>
        </div>
      </div>
      <AnnouncementBanners />
      <LatestCrisis committeeId={committee.id} href={`/delegate/${encodeURIComponent(committee.code)}/crisis`} />
      {children}
    </>
  );
}
