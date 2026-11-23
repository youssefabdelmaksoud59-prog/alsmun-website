import { db } from "./db";
import { buildScoreSheet } from "./scoring";

export async function getScoreSheet(committeeId: string) {
  const [delegations, events, sessions] = await Promise.all([
    db.delegation.findMany({ where: { committeeId }, select: { id: true, name: true } }),
    db.scoreEvent.findMany({ where: { committeeId }, select: { delegationId: true, type: true, points: true } }),
    db.attendanceSession.findMany({ where: { committeeId }, select: { id: true, records: { select: { delegationId: true, status: true } } } }),
  ]);
  const attendance = sessions.flatMap((s) => s.records);
  return buildScoreSheet(delegations, events, attendance, sessions.length);
}
