"use client";

import { useActionState, useMemo, useState } from "react";
import { submitResolution } from "@/app/actions/public";
import { checkResolution, joinClauses } from "@/lib/thimun";
import { ResolutionDocument } from "@/components/resolution-document";
import { Alert } from "@/components/ui";
import { DelegationPicker, useDelegationChoice } from "./delegation-picker";
import { ClauseList } from "./clause-list";
import { SubmissionSuccess } from "./submission-success";
import { saveDelegation } from "./storage";
import type { PortalCommittee } from "./types";

export function ResolutionForm({ committee }: { committee: PortalCommittee }) {
  const [state, action, pending] = useActionState(submitResolution, null);
  const [formKey, setFormKey] = useState(0);
  const choice = useDelegationChoice(committee);
  const [topic, setTopic] = useState("");
  const [coSubmitters, setCoSubmitters] = useState("");
  const [pre, setPre] = useState<string[]>([""]);
  const [op, setOp] = useState<string[]>([""]);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [dismissedKey, setDismissedKey] = useState(-1);

  const delegationName =
    committee.delegations.find((d) => d.id === choice.delegationId)?.name || choice.delegationName || "Your delegation";
  const preClean = pre.map((c) => c.trim()).filter(Boolean);
  const opClean = op.map((c) => c.trim()).filter(Boolean);
  const issues = useMemo(() => checkResolution(preClean, opClean), [preClean.join("\u0000"), opClean.join("\u0000")]); // eslint-disable-line react-hooks/exhaustive-deps
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  if (state?.ok && state.data && dismissedKey !== formKey) {
    return (
      <SubmissionSuccess
        kind="Resolution"
        code={state.data.code}
        reference={state.data.reference}
        onAnother={() => {
          setDismissedKey(formKey);
          setFormKey((k) => k + 1);
          setPre([""]);
          setOp([""]);
          setCoSubmitters("");
        }}
      />
    );
  }

  return (
    <form
      key={formKey}
      action={action}
      className="space-y-6"
      onSubmit={() => saveDelegation({ committeeId: choice.committeeId, delegationId: choice.delegationId, delegationName: choice.delegationName })}
    >
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <input type="hidden" name="preambulatory" value={joinClauses(pre)} />
      <input type="hidden" name="operative" value={joinClauses(op)} />

      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}

      <section className="card card-pad space-y-4">
        <h2 className="text-base font-bold">1. Heading</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <DelegationPicker committee={committee} choice={choice} errors={errors} />
          <div>
            <label htmlFor="topic" className="label">Question of (topic)</label>
            {committee.topics.length > 0 ? (
              <select id="topic" name="topic" className="input" value={topic} onChange={(e) => setTopic(e.target.value)} required>
                <option value="">Choose the topic…</option>
                {committee.topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <input id="topic" name="topic" className="input" maxLength={200} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. The question of climate refugees" />
            )}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="coSubmitters" className="label">Co-submitters <span className="font-normal text-slate-500">(optional)</span></label>
            <input id="coSubmitters" name="coSubmitters" className="input" maxLength={600} value={coSubmitters} onChange={(e) => setCoSubmitters(e.target.value)} placeholder="e.g. France, Japan, Brazil" />
            {errors?.coSubmitters && <p className="field-error">{errors.coSubmitters}</p>}
          </div>
        </div>
      </section>

      <div className="flex gap-1 rounded-xl bg-slate-200/70 p-1 text-sm font-semibold" role="tablist">
        {(["write", "preview"] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-3 py-2 transition ${tab === t ? "bg-white text-navy-950 shadow" : "text-slate-600 hover:text-navy-900"}`}>
            {t === "write" ? "Write clauses" : "Preview in THIMUN format"}
          </button>
        ))}
      </div>

      {tab === "write" ? (
        <>
          <section className="card card-pad space-y-3">
            <div>
              <h2 className="text-base font-bold">2. Preambulatory clauses</h2>
              <p className="text-sm text-slate-500">Start with an opening phrase such as <em>Recalling</em> or <em>Deeply concerned by</em>, and end each clause with a comma.</p>
            </div>
            <ClauseList kind="preambulatory" clauses={pre} onChange={setPre} placeholder="Recognising the importance of…," />
            {errors?.preambulatory && <p className="field-error">{errors.preambulatory}</p>}
          </section>
          <section className="card card-pad space-y-3">
            <div>
              <h2 className="text-base font-bold">3. Operative clauses</h2>
              <p className="text-sm text-slate-500">Start with a verb such as <u>Urges</u> or <u>Calls upon</u>. End with a semicolon, and the last clause with a full stop. Put sub-clauses on new lines starting with a), b)…</p>
            </div>
            <ClauseList kind="operative" numbered clauses={op} onChange={setOp} placeholder={"Calls upon all Member States to:\na) …,\nb) …;"} />
            {errors?.operative && <p className="field-error">{errors.operative}</p>}
          </section>
        </>
      ) : (
        <section className="card card-pad">
          {preClean.length + opClean.length === 0 ? (
            <p className="text-sm text-slate-500">Write some clauses to see the preview.</p>
          ) : (
            <ResolutionDocument
              committeeName={committee.name}
              committeeCode={committee.code}
              topic={topic}
              submitter={delegationName}
              coSubmitters={coSubmitters}
              preambulatory={joinClauses(pre)}
              operative={joinClauses(op)}
            />
          )}
        </section>
      )}

      {issues.length > 0 && (
        <Alert kind="warning">
          <p className="mb-1 font-semibold">Format check</p>
          <ul className="list-disc space-y-0.5 pl-5">
            {issues.slice(0, 8).map((i, k) => <li key={k}>{i.message}</li>)}
          </ul>
          {issues.length > 8 && <p className="mt-1">…and {issues.length - 8} more.</p>}
          <p className="mt-2 text-xs">These are hints. You can still submit, but your chairs may ask you to fix them.</p>
        </Alert>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">Your chairs review every resolution before other delegates can see it.</p>
        <button type="submit" className="btn-gold min-w-48" disabled={pending}>
          {pending ? "Submitting…" : "Submit resolution"}
        </button>
      </div>
    </form>
  );
}
