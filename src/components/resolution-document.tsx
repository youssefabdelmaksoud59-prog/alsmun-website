import {
  openingPhrase,
  operativeClauses,
  parseOperativeClause,
  preambulatoryClauses,
  type SubClause,
} from "@/lib/thimun";

/** The opening phrase in italics (preambulatory) or underlined (operative), the rest as typed. */
function Lead({ text, kind }: { text: string; kind: "preambulatory" | "operative" }) {
  const phrase = openingPhrase(text, kind);
  const trimmed = text.trimStart();
  if (!phrase) return <>{trimmed}</>;
  const Tag = kind === "preambulatory" ? "em" : "u";
  return (
    <>
      <Tag>{phrase}</Tag>
      {trimmed.slice(phrase.length)}
    </>
  );
}

/*
 * Labels sit inline (not in a flex column) so that highlighting and copying gives
 * "1. Calls upon …" on one line, the way it reads on screen.
 */
function Subs({ items, depth }: { items: SubClause[]; depth: number }) {
  if (items.length === 0) return null;
  return (
    <div className={`reso-subs depth-${Math.min(depth, 4)}`}>
      {items.map((s, i) => (
        <div key={i} className="reso-sub">
          <p className="reso-line">
            <span className="reso-label">{s.label}</span> {s.text}
          </p>
          <Subs items={s.children} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}

export function ResolutionDocument({
  committeeName,
  committeeCode,
  topic,
  submitter,
  coSubmitters,
  preambulatory,
  operative,
  reference,
}: {
  committeeName: string;
  committeeCode?: string;
  topic: string;
  submitter: string;
  coSubmitters?: string;
  preambulatory: string;
  operative: string;
  reference?: string;
}) {
  const pre = preambulatoryClauses(preambulatory);
  const op = operativeClauses(operative).map(parseOperativeClause);
  const forum = committeeCode && committeeCode !== committeeName ? `${committeeName} (${committeeCode})` : committeeName;
  const committeeLine = /^the\s/i.test(committeeName) ? committeeName : `The ${committeeName}`;
  return (
    <article className="reso">
      <dl className="reso-head">
        {reference && (
          <div><dt>REFERENCE:</dt> <dd>{reference}</dd></div>
        )}
        <div><dt>FORUM:</dt> <dd>{forum}</dd></div>
        <div><dt>QUESTION OF:</dt> <dd>{topic || "—"}</dd></div>
        <div><dt>MAIN SUBMITTER:</dt> <dd>{submitter}</dd></div>
        {coSubmitters ? (
          <div><dt>CO-SUBMITTERS:</dt> <dd>{coSubmitters}</dd></div>
        ) : null}
      </dl>
      <p className="reso-committee">{committeeLine},</p>
      {pre.map((c, i) => (
        <p key={`p${i}`} className="reso-preamb">
          <Lead text={c} kind="preambulatory" />
        </p>
      ))}
      <div className="reso-ops">
        {op.map((c, i) => (
          <div key={`o${i}`} className="reso-op">
            <p className="reso-line">
              <span className="reso-label">{i + 1}.</span> <Lead text={c.text} kind="operative" />
            </p>
            <Subs items={c.subs} depth={1} />
          </div>
        ))}
      </div>
    </article>
  );
}
