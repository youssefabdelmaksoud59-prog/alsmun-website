/** THIMUN accepted opening phrases and helpers to format and check clauses. */

export const PREAMBULATORY_PHRASES = [
  "Acknowledging", "Affirming", "Alarmed by", "Approving", "Aware of", "Bearing in mind",
  "Believing", "Confident", "Congratulating", "Contemplating", "Convinced", "Declaring",
  "Deeply concerned", "Deeply concerned by", "Deeply conscious", "Deeply convinced", "Deeply disturbed", "Deeply regretting",
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
  "Encourages further", "Appeals", "Stresses", "Commends", "Advocates", "Calls on",
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

/* ---------- Structured view of a stored resolution ---------- */

export type SubClause = { label: string; text: string; children: SubClause[] };
export type OperativeClause = { text: string; subs: SubClause[] };

const LABEL_RE = /^([ \t]*)(\(?([0-9]{1,3}|[a-zA-Z]{1,5})[.)])[ \t]+(.*)$/;
const BULLET_RE = /^([ \t]*)([-•–])[ \t]+(.*)$/;
const ROMAN_RE = /^(i{1,3}|iv|v|vi{1,3}|ix|x|xi{1,3}|xiv|xv)$/i;

const indentWidth = (ws: string) => ws.replace(/\t/g, "    ").length;

type LabelLine = { indent: number; label: string; core: string; text: string };

function readLabel(line: string): LabelLine | null {
  const m = LABEL_RE.exec(line);
  if (m) return { indent: indentWidth(m[1]), label: m[2], core: m[3], text: m[4] };
  const b = BULLET_RE.exec(line);
  if (b) return { indent: indentWidth(b[1]), label: b[2], core: b[2], text: b[3] };
  return null;
}

/** "digit" | "roman" | "letter" | "upper" | "bullet" — used to tell nesting levels apart when there is no indentation. */
function labelStyle(core: string, prevLetter: string | null): string {
  if (/^[0-9]+$/.test(core)) return "digit";
  if (/^[-•–]$/.test(core)) return "bullet";
  if (core.length === 1 && prevLetter && core.toLowerCase().charCodeAt(0) === prevLetter.charCodeAt(0) + 1) return core === core.toUpperCase() ? "upper" : "letter";
  if (ROMAN_RE.test(core)) return core === core.toUpperCase() ? "ROMAN" : "roman";
  if (core.length === 1) return core === core.toUpperCase() ? "upper" : "letter";
  return "other";
}

/** A top-level operative clause typed with its own number ("2. Urges ...") rather than a sub-clause. */
function isNumberedTopClause(line: string) {
  const l = readLabel(line);
  return !!l && l.indent === 0 && /^[0-9]+$/.test(l.core) && !!openingPhrase(l.text, "operative");
}

/**
 * Operative clauses as stored (one per blank-line block). Blocks that start with a sub-clause label
 * belong to the clause before them: delegates often leave blank lines between sub-clauses.
 */
export function operativeClauses(text: string): string[] {
  const out: string[] = [];
  for (const chunk of text.replace(/\r\n/g, "\n").split(/\n[ \t]*\n/)) {
    if (!chunk.trim()) continue;
    const first = chunk.split("\n").find((l) => l.trim()) ?? "";
    if (out.length && readLabel(first) && !isNumberedTopClause(first)) out[out.length - 1] += "\n" + chunk.replace(/^\n+|\s+$/g, "");
    else out.push(chunk.replace(/^\n+|\s+$/g, ""));
  }
  return out;
}

/** Preambulatory clauses; a block holding several lines that each start with an opening phrase is split per line. */
export function preambulatoryClauses(text: string): string[] {
  const out: string[] = [];
  for (const chunk of splitClauses(text)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1 && lines.every((l) => openingPhrase(l, "preambulatory"))) out.push(...lines);
    else out.push(chunk);
  }
  return out;
}

/** Turn one operative clause into its opening text and nested sub-clauses, keeping the labels the delegate typed. */
export function parseOperativeClause(clause: string): OperativeClause {
  const lines = clause.split("\n").filter((l) => l.trim());
  let first = lines.shift() ?? "";
  const top = readLabel(first);
  if (top && /^[0-9]+$/.test(top.core) && top.indent === 0) first = top.text; // drop a typed "1." on the main clause

  const items: { level: number; node: SubClause }[] = [];
  const head: string[] = [first.trim()];
  const labelled = lines.map((l) => readLabel(l));
  const useIndent = labelled.some((l) => l && l.indent > 0);
  const indents = [...new Set(labelled.filter(Boolean).map((l) => l!.indent))].sort((a, b) => a - b);
  const styleOrder: string[] = [];
  let prevLetter: string | null = null;

  lines.forEach((line, i) => {
    const l = labelled[i];
    if (!l) {
      // A plain line continues whatever came before it.
      if (items.length) items[items.length - 1].node.text += "\n" + line.trim();
      else head.push(line.trim());
      return;
    }
    let level: number;
    if (useIndent) {
      level = indents.indexOf(l.indent) + 1;
    } else {
      const style = labelStyle(l.core, prevLetter);
      let at = styleOrder.indexOf(style);
      if (at === -1) { styleOrder.push(style); at = styleOrder.length - 1; }
      level = at + 1;
    }
    if (/^[a-z]$/i.test(l.core) && labelStyle(l.core, prevLetter).match(/letter|upper/)) prevLetter = l.core.toLowerCase();
    items.push({ level, node: { label: l.label, text: l.text.trim(), children: [] } });
  });

  // Build the tree: each item hangs under the nearest earlier item with a lower level.
  const roots: SubClause[] = [];
  const stack: { level: number; node: SubClause }[] = [];
  for (const it of items) {
    while (stack.length && stack[stack.length - 1].level >= it.level) stack.pop();
    (stack.length ? stack[stack.length - 1].node.children : roots).push(it.node);
    stack.push(it);
  }
  return { text: head.join("\n"), subs: roots };
}
