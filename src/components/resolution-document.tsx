import { isSubClauseLine, openingPhrase, splitClauses } from "@/lib/thimun";

function Phrase({ clause, kind }: { clause: string; kind: "preambulatory" | "operative" }) {
  const firstLine = clause.split("\n")[0];
  const phrase = openingPhrase(firstLine, kind);
  const rest = phrase ? firstLine.trimStart().slice(phrase.length) : firstLine;
  const Tag = kind === "preambulatory" ? "em" : "u";
  return (
    <>
      {phrase && <Tag>{phrase}</Tag>}
      {rest}
    </>
  );
}

export function ResolutionDocument({
  committeeName,
  topic,
  submitter,
  coSubmitters,
  preambulatory,
  operative,
  reference,
}: {
  committeeName: string;
  topic: string;
  submitter: string;
  coSubmitters?: string;
  preambulatory: string;
  operative: string;
  reference?: string;
}) {
  const pre = splitClauses(preambulatory);
  const op = splitClauses(operative);
  return (
    <article className="reso">
      <dl className="mb-5 grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 font-sans text-sm">
        {reference && (<><dt className="font-semibold text-slate-500">Reference</dt><dd>{reference}</dd></>)}
        <dt className="font-semibold text-slate-500">Forum</dt><dd>{committeeName}</dd>
        <dt className="font-semibold text-slate-500">Question of</dt><dd>{topic || "—"}</dd>
        <dt className="font-semibold text-slate-500">Submitted by</dt><dd>{submitter}</dd>
        {coSubmitters ? (<><dt className="font-semibold text-slate-500">Co-submitted by</dt><dd>{coSubmitters}</dd></>) : null}
      </dl>
      <p className="mb-3 font-semibold uppercase tracking-wide">The {committeeName},</p>
      {pre.map((c, i) => (
        <p key={`p${i}`} className="preamb whitespace-pre-line">
          <Phrase clause={c} kind="preambulatory" />
          {c.includes("\n") ? "\n" + c.split("\n").slice(1).join("\n") : null}
        </p>
      ))}
      {op.map((c, i) => {
        const lines = c.split("\n");
        return (
          <div key={`o${i}`} className="oper">
            <span className="num">{i + 1}.</span>
            <div className="min-w-0 flex-1">
              <Phrase clause={c} kind="operative" />
              {lines.slice(1).map((l, j) => (
                <span key={j} className={isSubClauseLine(l) ? "sub" : "block"}>
                  {l.trim()}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </article>
  );
}
