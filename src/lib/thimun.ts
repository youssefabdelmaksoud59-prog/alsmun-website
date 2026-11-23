/** THIMUN accepted opening phrases and helpers to format and check clauses. */

export const PREAMBULATORY_PHRASES = [
  "Acknowledging", "Affirming", "Alarmed by", "Approving", "Aware of", "Bearing in mind",
  "Believing", "Confident", "Congratulating", "Contemplating", "Convinced", "Declaring",
  "Deeply concerned", "Deeply conscious", "Deeply convinced", "Deeply disturbed", "Deeply regretting",
  "Deploring", "Desiring", "Emphasizing", "Emphasising", "Expecting", "Expressing its appreciation",
  "Expressing its satisfaction", "Fulfilling", "Fully alarmed", "Fully aware", "Fully believing",
  "Further deploring", "Further recalling", "Guided by", "Having adopted", "Having considered",
  "Having examined", "Having heard", "Having received", "Having studied", "Keeping in mind",
  "Noting further", "Noting with appreciation", "Noting with approval", "Noting with deep concern",
  "Noting with regret", "Noting with satisfaction", "Noting", "Observing", "Reaffirming", "Realizing",
  "Realising", "Recalling", "Recognizing", "Recognising", "Referring", "Reminding", "Seeking",
  "Taking into account", "Taking into consideration", "Taking note", "Viewing with appreciation",
  "Welcoming", "Concerned", "Conscious", "Considering", "Noting with concern", "Regretting",
  "Stressing", "Underlining",
];

export const OPERATIVE_PHRASES = [
  "Accepts", "Affirms", "Approves", "Asks", "Authorizes", "Authorises", "Calls for", "Calls upon",
  "Condemns", "Confirms", "Congratulates", "Considers", "Declares accordingly", "Deplores",
  "Designates", "Draws the attention", "Emphasizes", "Emphasises", "Encourages", "Endorses",
  "Expresses its appreciation", "Expresses its hope", "Expresses its satisfaction", "Further invites",
  "Further proclaims", "Further recommends", "Further reminds", "Further requests", "Further resolves",
  "Has resolved", "Invites", "Notes", "Proclaims", "Reaffirms", "Recommends", "Regrets", "Reminds",
  "Requests", "Resolves", "Solemnly affirms", "Strongly condemns", "Strongly urges", "Suggests", "Supports",
  "Takes note of", "Transmits", "Trusts", "Urges", "Welcomes", "Demands", "Decides", "Instructs",
  "Strongly encourages", "Strongly recommends", "Highly recommends", "Recognizes", "Recognises",
  "Encourages further", "Appeals", "Stresses", "Commends",
];

// Longest first so "Noting with concern" wins over "Noting".
const sortByLength = (a: string, b: string) => b.length - a.length;
const PREAMB_SORTED = [...PREAMBULATORY_PHRASES].sort(sortByLength);
const OPER_SORTED = [...OPERATIVE_PHRASES].sort(sortByLength);

/** Split a block of text into clauses. Clauses are separated by one or more blank lines. */
export function splitClauses(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((c) => c.trim())
    .filter(Boolean);
}

export function joinClauses(clauses: string[]): string {
  return clauses.map((c) => c.trim()).filter(Boolean).join("\n\n");
}

/** Find the accepted opening phrase a clause begins with, if any. */
export function openingPhrase(clause: string, kind: "preambulatory" | "operative"): string | null {
  const list = kind === "preambulatory" ? PREAMB_SORTED : OPER_SORTED;
  const lower = clause.trimStart().toLowerCase();
  for (const p of list) {
    const pl = p.toLowerCase();
    if (lower.startsWith(pl) && (lower.length === pl.length || /[\s,:;]/.test(lower[pl.length]))) {
      return clause.trimStart().slice(0, p.length);
    }
  }
  return null;
}

export type ClauseIssue = { clause: number; message: string };

/** Friendly format checks. They are hints for the delegate, never hard blocks. */
export function checkResolution(preamb: string[], oper: string[]): ClauseIssue[] {
  const issues: ClauseIssue[] = [];
  preamb.forEach((c, i) => {
    if (!openingPhrase(c, "preambulatory"))
      issues.push({ clause: i + 1, message: `Preambulatory clause ${i + 1} does not start with a standard preambulatory phrase.` });
    if (!c.trimEnd().endsWith(","))
      issues.push({ clause: i + 1, message: `Preambulatory clause ${i + 1} should end with a comma.` });
  });
  oper.forEach((c, i) => {
    const last = i === oper.length - 1;
    if (!openingPhrase(c, "operative"))
      issues.push({ clause: i + 1, message: `Operative clause ${i + 1} does not start with a standard operative phrase.` });
    const end = c.trimEnd();
    if (last && !end.endsWith("."))
      issues.push({ clause: i + 1, message: `The last operative clause should end with a full stop.` });
    if (!last && !end.endsWith(";"))
      issues.push({ clause: i + 1, message: `Operative clause ${i + 1} should end with a semicolon.` });
  });
  return issues;
}

/** Operative sub-clause lines start with "a)", "b.", "i)" etc. */
export function isSubClauseLine(line: string) {
  return /^\s*(\(?[a-z]{1,4}[).]|[-•])\s+/i.test(line);
}
