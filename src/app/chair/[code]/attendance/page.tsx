import { requireCommitteeAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { AttendanceBoard, NewSessionForm, SessionPicker } from "@/components/chair/attendance-board";
import { EmptyState } from "@/components/ui";

export default async function AttendancePage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ session?: string }> }) {
  const { committee } = await requireCommitteeAccess((await params).code);
  const { session: sessionParam } = await searchParams;
  const base = `/chair/${encodeURIComponent(committee.code)}/attendance`;
  const [sessions, delegations] = await Promise.all([
    db.attendanceSession.findMany({ where: { committeeId: committee.id }, orderBy: { createdAt: "asc" }, select: { id: true, name: true } }),
    db.delegation.findMany({ where: { committeeId: committee.id }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const active = sessions.find((s) => s.id === sessionParam) ?? sessions[sessions.length - 1];
  const records = active ? await db.attendanceRecord.findMany({ where: { sessionId: active.id } }) : [];
  const byDelegation = new Map(records.map((r) => [r.delegationId, r.status]));

  return (
    <div className="space-y-6">
      <div className="card card-pad space-y-4">
        <NewSessionForm committeeId={committee.id} base={base} suggested={`Session ${sessions.length + 1}`} />
        {sessions.length > 0 && <SessionPicker sessions={sessions} active={active?.id} base={base} />}
      </div>
      {delegations.length === 0 ? (
        <EmptyState title="No delegations yet">Add your committee’s delegations on the “Delegations & topics” tab first.</EmptyState>
      ) : !active ? (
        <EmptyState title="No roll calls yet">Start a roll call above at the beginning of each session.</EmptyState>
      ) : (
        <AttendanceBoard
          key={active.id}
          sessionId={active.id}
          sessionName={active.name}
          base={base}
          rows={delegations.map((d) => ({ id: d.id, name: d.name, status: byDelegation.get(d.id) ?? null }))}
        />
      )}
    </div>
  );
}
