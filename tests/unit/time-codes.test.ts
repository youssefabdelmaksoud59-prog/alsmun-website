import { describe, expect, it } from "vitest";
import { utcToZonedInput, zonedToUtc } from "@/lib/time";
import { normaliseCode, trackingCode } from "@/lib/codes";

describe("time zones", () => {
  it("round-trips wall-clock times in Cairo", () => {
    const d = zonedToUtc("2026-12-05T09:30", "Africa/Cairo")!;
    expect(d.toISOString()).toBe("2026-12-05T07:30:00.000Z");
    expect(utcToZonedInput(d, "Africa/Cairo")).toBe("2026-12-05T09:30");
  });
  it("handles daylight saving time zones", () => {
    expect(zonedToUtc("2026-07-01T12:00", "Europe/London")!.toISOString()).toBe("2026-07-01T11:00:00.000Z");
    expect(zonedToUtc("2026-01-01T12:00", "Europe/London")!.toISOString()).toBe("2026-01-01T12:00:00.000Z");
  });
  it("rejects bad input", () => {
    expect(zonedToUtc("tomorrow")).toBeNull();
  });
});

describe("tracking codes", () => {
  it("are well formed and unambiguous", () => {
    for (let i = 0; i < 200; i++) {
      const c = trackingCode("A");
      expect(c).toMatch(/^A-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    }
  });
  it("normalise sloppy input", () => {
    expect(normaliseCode(" r abcd efgh ")).toBe("R-ABCD-EFGH");
    expect(normaliseCode("r-abcd-efgh")).toBe("R-ABCD-EFGH");
  });
});
