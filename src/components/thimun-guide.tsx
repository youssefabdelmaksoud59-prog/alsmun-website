import { OPERATIVE_PHRASES, PREAMBULATORY_PHRASES } from "@/lib/thimun";

const uniqSorted = (l: string[]) => [...new Set(l)].sort((a, b) => a.localeCompare(b));

function PhraseList({ title, phrases, style }: { title: string; phrases: string[]; style: "italic" | "underline" }) {
  return (
    <details className="group rounded-lg border border-slate-200 bg-slate-50/60 open:bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-semibold text-navy-900">
        {title}
        <span className="text-xs font-medium text-slate-500 group-open:hidden">Show {phrases.length}</span>
        <span className="hidden text-xs font-medium text-slate-500 group-open:inline">Hide</span>
      </summary>
      <ul className="grid grid-cols-1 gap-x-4 gap-y-1 px-3 pb-3 text-sm text-slate-700 sm:grid-cols-2">
        {uniqSorted(phrases).map((p) => (
          <li key={p} className={style === "italic" ? "italic" : "underline underline-offset-2"}>{p}</li>
        ))}
      </ul>
    </details>
  );
}

export function ResolutionGuide() {
  return (
    <div className="prose-guide">
      <h3 className="!mt-0">How a THIMUN resolution is built</h3>
      <p>A resolution is one long sentence. It has three parts, always in this order.</p>
      <ol className="mb-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
        <li><strong>Heading.</strong> Forum (your committee), &ldquo;Question of&rdquo; (the topic), the main submitter and the co-submitters. The form fills these in for you.</li>
        <li><strong>Preambulatory clauses.</strong> Explain the background and why the committee is acting. Each one starts with an <em>italicised</em> opening phrase and <strong>ends with a comma</strong>. They are not numbered.</li>
        <li><strong>Operative clauses.</strong> Say what should be done. They are <strong>numbered</strong>, start with an <u>underlined</u> verb in the present tense, and <strong>end with a semicolon</strong>. The <strong>final</strong> operative clause ends with a <strong>full stop</strong>.</li>
      </ol>
      <h3>Sub-clauses</h3>
      <p>Put sub-clauses on new lines inside an operative clause, lettered <code>a)</code>, <code>b)</code>, then <code>i)</code>, <code>ii)</code>. Sub-clauses end with a comma, and the last one ends with the clause&rsquo;s semicolon.</p>
      <h3>Example</h3>
      <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3 font-serif text-[13.5px] leading-relaxed text-ink">
        <p className="!mb-1 !text-[13.5px] !text-ink">The General Assembly,</p>
        <p className="!mb-1 !text-[13.5px] !text-ink"><em>Recalling</em> the Universal Declaration of Human Rights,</p>
        <p className="!mb-2 !text-[13.5px] !text-ink"><em>Deeply concerned</em> by the rising number of displaced persons,</p>
        <p className="!mb-1 !text-[13.5px] !text-ink">1. <u>Calls upon</u> all Member States to:</p>
        <p className="!mb-0 !ml-5 !text-[13.5px] !text-ink">a) share data on displacement,</p>
        <p className="!mb-1 !ml-5 !text-[13.5px] !text-ink">b) fund regional reception centres;</p>
        <p className="!mb-0 !text-[13.5px] !text-ink">2. <u>Decides</u> to remain actively seized of the matter.</p>
      </div>
      <h3>Good practice</h3>
      <ul>
        <li>Spell out every acronym the first time you use it.</li>
        <li>Be specific: who acts, what they do, how it is funded and monitored.</li>
        <li>Only the Security Council can <em>demand</em> or <em>condemn</em> with binding force.</li>
      </ul>
      <div className="mt-4 space-y-2">
        <PhraseList title="Preambulatory phrases" phrases={PREAMBULATORY_PHRASES} style="italic" />
        <PhraseList title="Operative phrases" phrases={OPERATIVE_PHRASES} style="underline" />
      </div>
    </div>
  );
}

export function AmendmentGuide() {
  return (
    <div className="prose-guide">
      <h3 className="!mt-0">How a THIMUN amendment works</h3>
      <p>An amendment changes one clause of the resolution that is on the floor. Only <strong>operative clauses</strong> can be amended. Preambulatory clauses cannot.</p>
      <h3>Every amendment states</h3>
      <ul>
        <li><strong>The resolution</strong> it applies to.</li>
        <li><strong>The clause</strong>, by number, with a sub-clause if needed (for example <em>Clause 3, sub-clause b</em>).</li>
        <li><strong>The action:</strong> <em>add</em> a new clause or sub-clause, <em>modify</em> existing wording, or <em>strike</em> (delete) it.</li>
        <li><strong>The exact new wording</strong>, written as it should appear in the resolution, with correct punctuation.</li>
      </ul>
      <h3>Examples</h3>
      <div className="mb-3 space-y-2 text-sm">
        <div className="rounded-lg border border-slate-200 bg-white p-3"><p className="!mb-1 font-semibold !text-navy-900">Modify</p><p className="!mb-0">Modify clause 2 to read: &ldquo;2. <u>Urges</u> Member States to double funding for regional reception centres by 2030;&rdquo;</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-3"><p className="!mb-1 font-semibold !text-navy-900">Add</p><p className="!mb-0">Add a sub-clause c to clause 1: &ldquo;c) establish an independent monitoring body,&rdquo;</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-3"><p className="!mb-1 font-semibold !text-navy-900">Strike</p><p className="!mb-0">Strike clause 4.</p></div>
      </div>
      <h3>Rules of procedure</h3>
      <ul>
        <li>The chair decides whether an amendment is in order and when it is debated.</li>
        <li>An amendment to the second degree (amending an amendment) is only allowed if the chair permits it.</li>
        <li>Amendments are not friendly or unfriendly at THIMUN: every amendment is voted on.</li>
      </ul>
      <div className="mt-4">
        <PhraseList title="Operative phrases" phrases={OPERATIVE_PHRASES} style="underline" />
      </div>
    </div>
  );
}
