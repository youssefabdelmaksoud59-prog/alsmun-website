import { describe, expect, it } from "vitest";
import { checkResolution, isSubClauseLine, joinClauses, openingPhrase, operativeClauses, parseOperativeClause, preambulatoryClauses, splitClauses, type SubClause } from "@/lib/thimun";

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

describe("resolution structure", () => {
  const flat = (subs: SubClause[], d = 1): string[] => subs.flatMap((s) => [`${d}:${s.label}`, ...flat(s.children, d + 1)]);

  it("nests sub-clauses by indentation and keeps the typed labels", () => {
    const c = parseOperativeClause(
      "Calls upon States to act, through:\n   1. Building by:\n      1. One;\n\n      2. Two;\n   2. Improving through:\n      1. Three;",
    );
    expect(c.text).toBe("Calls upon States to act, through:");
    expect(flat(c.subs)).toEqual(["1:1.", "2:1.", "2:2.", "1:2.", "2:1."]);
  });

  it("nests a./i. labels without indentation", () => {
    const c = parseOperativeClause("Advocates for help including:\na. Transfer, including:\ni. One;\nii. Two;\nb. Measures:\ni. Three;\nc. Digital help:\ni. Four;");
    expect(flat(c.subs)).toEqual(["1:a.", "2:i.", "2:ii.", "1:b.", "2:i.", "1:c.", "2:i."]);
  });

  it("joins blocks that start with a sub-clause back onto their clause", () => {
    const op = "Urges States to:\n   1. Fund;\n\n   2. Train;\n\nRequests reports;\n\n3. Decides to remain seized.";
    const clauses = operativeClauses(op);
    expect(clauses).toHaveLength(3);
    expect(parseOperativeClause(clauses[0]).subs.map((s) => s.label)).toEqual(["1.", "2."]);
    expect(parseOperativeClause(clauses[2]).text).toBe("Decides to remain seized.");
  });

  it("splits a block of one-per-line preambulatory clauses", () => {
    expect(preambulatoryClauses("Recalling A,\nNoting B,")).toEqual(["Recalling A,", "Noting B,"]);
    expect(preambulatoryClauses("Recalling A that\ncontinues here,")).toHaveLength(1);
  });
});
