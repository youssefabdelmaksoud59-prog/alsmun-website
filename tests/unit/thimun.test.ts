import { describe, expect, it } from "vitest";
import { checkResolution, isSubClauseLine, joinClauses, openingPhrase, splitClauses } from "@/lib/thimun";

describe("clauses", () => {
  it("splits on blank lines and joins back", () => {
    const text = "Recalling A,\n\n\nNoting B,\n  \nAware of C,";
    expect(splitClauses(text)).toEqual(["Recalling A,", "Noting B,", "Aware of C,"]);
    expect(joinClauses(["a", " ", "b "])).toBe("a\n\nb");
  });

  it("finds the longest matching opening phrase", () => {
    expect(openingPhrase("Noting with deep concern the rise,", "preambulatory")).toBe("Noting with deep concern");
    expect(openingPhrase("Noting the rise,", "preambulatory")).toBe("Noting");
    expect(openingPhrase("Notingly odd,", "preambulatory")).toBeNull();
    expect(openingPhrase("calls upon states;", "operative")).toBe("calls upon");
  });

  it("flags punctuation and phrase problems but accepts a correct resolution", () => {
    expect(checkResolution(["Recalling the Charter,"], ["Urges states to act;", "Decides to remain seized of the matter."])).toEqual([]);
    const issues = checkResolution(["Banana the Charter."], ["Urges states to act.", "Decides to remain seized;"]);
    const msgs = issues.map((i) => i.message).join(" | ");
    expect(msgs).toContain("standard preambulatory phrase");
    expect(msgs).toContain("should end with a comma");
    expect(msgs).toContain("Operative clause 1 should end with a semicolon");
    expect(msgs).toContain("last operative clause should end with a full stop");
  });

  it("detects sub-clause lines", () => {
    expect(isSubClauseLine("a) share data,")).toBe(true);
    expect(isSubClauseLine("  ii. fund centres;")).toBe(true);
    expect(isSubClauseLine("Further requests")).toBe(false);
  });
});
