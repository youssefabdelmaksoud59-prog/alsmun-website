import type { ScoreType } from "@prisma/client";

/** Points awarded per scoring action. POI follow-ups are not scored. */
export const POINTS: Record<ScoreType, number> = {
  POI: 1,
  SPEECH: 2,
  AMENDMENT: 3,
  RESOLUTION: 3,
};

export const SCORE_LABELS: Record<ScoreType, string> = {
  POI: "Point of information",
  SPEECH: "Speech",
  AMENDMENT: "Amendment chosen",
  RESOLUTION: "Resolution chosen",
};

export type ScoreRow = {
  delegationId: string;
  delegation: string;
  poi: number;
  speech: number;
  amendment: number;
  resolution: number;
  total: number;
  attended: number;
  sessions: number;
  rank: number;
};

type EventLike = { delegationId: string; type: ScoreType; points: number };
type AttendanceLike = { delegationId: string; status: "PRESENT" | "PRESENT_AND_VOTING" | "ABSENT" };

/**
 * Build the score sheet: one row per delegation with counts per category,
 * total points and attendance. Rows are sorted by total (desc), then name,
 * and ranked with ties sharing the same rank (1, 2, 2, 4 ...).
 */
export function buildScoreSheet(
  delegations: { id: string; name: string }[],
  events: EventLike[],
  attendance: AttendanceLike[],
  sessionCount: number,
): ScoreRow[] {
  const rows = new Map<string, ScoreRow>();
  for (const d of delegations) {
    rows.set(d.id, {
      delegationId: d.id,
      delegation: d.name,
      poi: 0,
      speech: 0,
      amendment: 0,
      resolution: 0,
      total: 0,
      attended: 0,
      sessions: sessionCount,
      rank: 0,
    });
  }
  for (const e of events) {
    const row = rows.get(e.delegationId);
    if (!row) continue;
    if (e.type === "POI") row.poi += 1;
    else if (e.type === "SPEECH") row.speech += 1;
    else if (e.type === "AMENDMENT") row.amendment += 1;
    else if (e.type === "RESOLUTION") row.resolution += 1;
    row.total += e.points;
  }
  for (const a of attendance) {
    const row = rows.get(a.delegationId);
    if (row && a.status !== "ABSENT") row.attended += 1;
  }
  const sorted = [...rows.values()].sort(
    (a, b) => b.total - a.total || a.delegation.localeCompare(b.delegation),
  );
  sorted.forEach((row, i) => {
    row.rank = i > 0 && sorted[i - 1].total === row.total ? sorted[i - 1].rank : i + 1;
  });
  return sorted;
}
