"use client";

import { useActionState, useState } from "react";
import { submitAmendment } from "@/app/actions/public";
import { Alert } from "@/components/ui";
import { DelegationPicker, useDelegationChoice } from "./delegation-picker";
import { SubmissionSuccess } from "./submission-success";
import { saveDelegation } from "./storage";
import type { PortalCommittee } from "./types";

const ACTIONS = [
  { value: "MODIFY", label: "Modify", help: "Change the wording of an existing clause." },
  { value: "ADD", label: "Add", help: "Insert a new clause or sub-clause." },
  { value: "STRIKE", label: "Strike", help: "Delete a clause or sub-clause." },
] as const;

export function AmendmentForm({ committees, initialCommittee, initialResolution }: { committees: PortalCommittee[]; initialCommittee?: string; initialResolution?: string }) {
  const [state, action, pending] = useActionState(submitAmendment, null);
  const [formKey, setFormKey] = useState(0);
  const [dismissedKey, setDismissedKey] = useState(-1);
  const choice = useDelegationChoice(committees, initialCommittee);
  const [resolutionId, setResolutionId] = useState(initialResolution ?? "");
  const [resolutionRef, setResolutionRef] = useState("");
  const [clause, setClause] = useState("");
  const [act, setAct] = useState<"ADD" | "MODIFY" | "STRIKE">("MODIFY");
  const [text, setText] = useState("");
  const [rationale, setRationale] = useState("");

  const committee = committees.find((c) => c.id === choice.committeeId);
  const errors = state && !state.ok ? state.fieldErrors : undefined;
  const hasResolutions = (committee?.resolutions.length ?? 0) > 0;

  if (state?.ok && state.data && dismissedKey !== formKey) {
    return (
      <SubmissionSuccess
        kind="Amendment"
        code={state.data.code}
        reference={state.data.reference}
        onAnother={() => {
          setDismissedKey(formKey);
          setFormKey((k) => k + 1);
          setClause("");
          setText("");
          setRationale("");
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
      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}

      <section className="card card-pad space-y-4">
        <h2 className="text-base font-bold">Who is submitting</h2>
        <DelegationPicker committees={committees} choice={{ ...choice, setCommitteeId: (v) => { choice.setCommitteeId(v); setResolutionId(""); } }} errors={errors} />
      </section>

      <section className="card card-pad space-y-5">
        <h2 className="text-base font-bold">The amendment</h2>
        <div>
          <label htmlFor={hasResolutions ? "resolutionId" : "resolutionRef"} className="label">Resolution being amended</label>
          {hasResolutions ? (
            <select id="resolutionId" name="resolutionId" className="input" value={resolutionId} onChange={(e) => setResolutionId(e.target.value)} required aria-invalid={!!errors?.resolutionId}>
              <option value="">Choose the resolution…</option>
              {committee!.resolutions.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          ) : (
            <>
              <input id="resolutionRef" name="resolutionRef" className="input" maxLength={120} value={resolutionRef} onChange={(e) => setResolutionRef(e.target.value)} placeholder="e.g. Draft resolution by France on climate refugees" required aria-invalid={!!errors?.resolutionId} />
              <p className="hint">{committee ? "No approved resolutions are listed for this committee yet, so describe the one on the floor." : "Choose your committee first."}</p>
            </>
          )}
          {errors?.resolutionId && <p className="field-error">{errors.resolutionId}</p>}
        </div>

        <fieldset>
          <legend className="label">Action</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {ACTIONS.map((a) => (
              <label key={a.value} className={`cursor-pointer rounded-xl border-2 p-3 transition ${act === a.value ? "border-navy-600 bg-navy-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                <input type="radio" name="action" value={a.value} checked={act === a.value} onChange={() => setAct(a.value)} className="sr-only" />
                <span className="block font-semibold text-navy-950">{a.label}</span>
                <span className="block text-xs text-slate-500">{a.help}</span>
              </label>
            ))}
          </div>
          {errors?.action && <p className="field-error">{errors.action}</p>}
        </fieldset>

        <div>
          <label htmlFor="clause" className="label">Clause</label>
          <input id="clause" name="clause" className="input" maxLength={120} value={clause} onChange={(e) => setClause(e.target.value)}
            placeholder={act === "ADD" ? "e.g. New sub-clause c in clause 3" : "e.g. Clause 3, sub-clause b"} required aria-invalid={!!errors?.clause} />
          <p className="hint">Only operative clauses can be amended.</p>
          {errors?.clause && <p className="field-error">{errors.clause}</p>}
        </div>

        {act !== "STRIKE" && (
          <div>
            <label htmlFor="text" className="label">{act === "ADD" ? "Wording to add" : "New wording of the clause"}</label>
            <textarea id="text" name="text" className="input min-h-[120px] font-serif" maxLength={5000} value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Write it exactly as it should appear in the resolution, with the operative phrase and punctuation." required aria-invalid={!!errors?.text} />
            {errors?.text && <p className="field-error">{errors.text}</p>}
          </div>
        )}

        <div>
          <label htmlFor="rationale" className="label">Why? <span className="font-normal text-slate-500">(optional, only your chairs see this)</span></label>
          <textarea id="rationale" name="rationale" className="input min-h-[70px]" maxLength={2000} value={rationale} onChange={(e) => setRationale(e.target.value)} />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">Other delegates will see your amendment once a chair approves it.</p>
        <button type="submit" className="btn-gold min-w-48" disabled={pending}>{pending ? "Submitting…" : "Submit amendment"}</button>
      </div>
    </form>
  );
}
