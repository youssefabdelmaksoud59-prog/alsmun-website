import { requireCommitteeAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChairNav } from "@/components/chair/chair-nav";
import { StaffBar } from "@/components/staff-bar";
import Link from "next/link";
import { AnnouncementBanners, LatestCrisis } from "@/components/broadcast-banners";

export const dynamic = "force-dynamic";

export default async function ChairLayout({ children, params }: { children: React.ReactNode; params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { user, committee } = await requireCommitteeAccess(code);
  const [resolutions, amendments, issues] = await Promise.all([
    db.resolution.count({ where: { committeeId: committee.id, status: "PENDING" } }),
    db.amendment.count({ where: { committeeId: committee.id, status: "PENDING" } }),
    db.issue.count({ where: { committeeId: committee.id, status: "OPEN", kind: { not: "STRIKE" } } }),
  ]);
  return (
    <>
      <StaffBar user={user}>
        {user.role === "SECRETARIAT" && <Link href="/chair" className="btn-ghost btn-sm">All committees</Link>}
      </StaffBar>
      <AnnouncementBanners />
      <LatestCrisis committeeId={committee.id} href={`/chair/${encodeURIComponent(committee.code)}/crisis`} />
      <div className="container-page">
        <div className="pb-3 pt-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-600">Chair panel</p>
          <h1 className="text-2xl font-bold sm:text-3xl">
            <span className="mr-2 rounded-md bg-navy-900 px-2 py-0.5 align-middle text-lg text-gold-300 sm:text-xl">{committee.code}</span>
            <span className="align-middle">{committee.name}</span>
          </h1>
        </div>
        <ChairNav code={committee.code} pending={{ resolutions, amendments, issues }} />
        <div className="pt-6">{children}</div>
      </div>
    </>
  );
}
