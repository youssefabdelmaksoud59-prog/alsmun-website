import { describe, expect, it } from "vitest";
import { buildScoreSheet, POINTS } from "@/lib/scoring";

describe("points", () => {
  it("uses the agreed values", () => {
    expect(POINTS).toEqual({ POI: 1, SPEECH: 2, AMENDMENT: 3, RESOLUTION: 3 });
  });
});

describe("buildScoreSheet", () => {
  const delegations = [
    { id: "fr", name: "France" },
    { id: "jp", name: "Japan" },
    { id: "br", name: "Brazil" },
    { id: "eg", name: "Egypt" },
  ];

  it("counts each category, totals points and ranks with ties", () => {
    const events = [
      { delegationId: "fr", type: "POI" as const, points: 1 },
      { delegationId: "fr", type: "SPEECH" as const, points: 2 },
      { delegationId: "fr", type: "AMENDMENT" as const, points: 3 },
      { delegationId: "jp", type: "RESOLUTION" as const, points: 3 },
      { delegationId: "jp", type: "SPEECH" as const, points: 2 },
      { delegationId: "jp", type: "POI" as const, points: 1 },
      { delegationId: "br", type: "SPEECH" as const, points: 2 },
      { delegationId: "unknown", type: "SPEECH" as const, points: 2 },
    ];
    const attendance = [
      { delegationId: "fr", status: "PRESENT" as const },
      { delegationId: "fr", status: "PRESENT_AND_VOTING" as const },
      { delegationId: "jp", status: "ABSENT" as const },
    ];
    const sheet = buildScoreSheet(delegations, events, attendance, 2);
    expect(sheet.map((r) => [r.delegation, r.total, r.rank])).toEqual([
      ["France", 6, 1],
      ["Japan", 6, 1],
      ["Brazil", 2, 3],
      ["Egypt", 0, 4],
    ]);
    const fr = sheet.find((r) => r.delegationId === "fr")!;
    expect(fr).toMatchObject({ poi: 1, speech: 1, amendment: 1, resolution: 0, attended: 2, sessions: 2 });
    expect(sheet.find((r) => r.delegationId === "jp")!.attended).toBe(0);
  });

  it("returns an empty sheet without delegations", () => {
    expect(buildScoreSheet([], [], [], 0)).toEqual([]);
  });
});
