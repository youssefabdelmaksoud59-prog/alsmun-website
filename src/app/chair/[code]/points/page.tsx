import { requireCommitteeAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { getScoreSheet } from "@/lib/scoresheet";
import { PointsBoard } from "@/components/chair/points-board";
import { formatTime } from "@/lib/time";
import { AutoRefresh } from "@/components/auto-refresh";

export default async function PointsPage({ params }: { params: Promise<{ code: string }> }) {
  const { committee } = await requireCommitteeAccess((await params).code);
  const [sheet, recent] = await Promise.all([
    getScoreSheet(committee.id),
    db.scoreEvent.findMany({ where: { committeeId: committee.id }, orderBy: { createdAt: "desc" }, take: 40, include: { delegation: { select: { name: true } } } }),
  ]);
  return (
    <>
      <AutoRefresh seconds={30} />
      <PointsBoard
        committeeId={committee.id}
        rows={sheet.map((r) => ({ id: r.delegationId, name: r.delegation, poi: r.poi, speech: r.speech, total: r.total }))}
        recent={recent.map((e) => ({ id: e.id, delegation: e.delegation.name, type: e.type, points: e.points, at: formatTime(e.createdAt), linked: !!(e.amendmentId || e.resolutionId) }))}
      />
    </>
  );
}
