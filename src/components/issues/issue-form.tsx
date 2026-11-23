"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { reportIssue } from "@/app/actions/issues";
import { Alert } from "@/components/ui";

type Committee = { id: string; code: string; delegations: { id: string; name: string }[] };

const KINDS = [
  { value: "STRIKE", label: "Strike", help: "A delegation broke the rules." },
  { value: "EQUIPMENT", label: "Missing equipment", help: "Microphone, projector, placards…" },
  { value: "OTHER", label: "Other problem", help: "Anything the secretariat should know." },
] as const;

/** Chairs pass their one committee; the secretariat passes all of them and may pick none. */
export function IssueForm({ committees, fixedCommittee }: { committees: Committee[]; fixedCommittee?: boolean }) {
  const [state, action, pending] = useActionState(reportIssue, null);
  const [kind, setKind] = useState<"STRIKE" | "EQUIPMENT" | "OTHER">("STRIKE");
  const [committeeId, setCommitteeId] = useState(fixedCommittee ? committees[0]?.id ?? "" : "");
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      const details = ref.current?.querySelector<HTMLTextAreaElement>("textarea[name=details]");
      if (details) details.value = "";
    }
  }, [state]);
  const e = state && !state.ok ? state.fieldErrors : undefined;
  const committee = committees.find((c) => c.id === committeeId);

  return (
    <form ref={ref} action={action} className="space-y-4">
      <h2 className="text-base font-bold">Report a problem</h2>
      <fieldset>
        <legend className="label">What happened?</legend>
        <div className="grid grid-cols-1 gap-2">
          {KINDS.map((k) => (
            <label key={k.value} className={`cursor-pointer rounded-xl border-2 px-3 py-2 transition ${kind === k.value ? "border-navy-600 bg-navy-50" : "border-slate-200 hover:border-slate-300"}`}>
              <input type="radio" name="kind" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} className="sr-only" />
              <span className="block text-sm font-semibold text-navy-950">{k.label}</span>
              <span className="block text-xs text-slate-500">{k.help}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {fixedCommittee ? (
        <input type="hidden" name="committeeId" value={committeeId} />
      ) : (
        <div>
          <label htmlFor="issue-committee" className="label">Committee</label>
          <select id="issue-committee" name="committeeId" className="input" value={committeeId} onChange={(ev) => setCommitteeId(ev.target.value)} required={kind === "STRIKE"}>
            <option value="">{kind === "STRIKE" ? "Choose…" : "Whole conference"}</option>
            {committees.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
          {e?.committeeId && <p className="field-error">{e.committeeId}</p>}
        </div>
      )}

      {kind === "STRIKE" && (
        <div>
          <label htmlFor="issue-delegation" className="label">Delegation</label>
          <select id="issue-delegation" name="delegationId" className="input" required disabled={!committee}>
            <option value="">{committee ? "Choose the delegation…" : "Choose a committee first"}</option>
            {committee?.delegations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {committee && committee.delegations.length === 0 && <p className="hint">Add delegations to the roster first.</p>}
          {e?.delegationId && <p className="field-error">{e.delegationId}</p>}
        </div>
      )}

      <div>
        <label htmlFor="issue-details" className="label">{kind === "STRIKE" ? "Reason for the strike" : kind === "EQUIPMENT" ? "What is missing, and where?" : "Details"}</label>
        <textarea id="issue-details" name="details" className="input min-h-[80px]" maxLength={1000} required
          placeholder={kind === "STRIKE" ? "e.g. Used a phone during voting procedure" : kind === "EQUIPMENT" ? "e.g. Second microphone not working in Room 101" : ""} />
        {e?.details && <p className="field-error">{e.details}</p>}
      </div>

      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">{state.message}</Alert>}
      <button type="submit" className={kind === "STRIKE" ? "btn-danger w-full" : "btn-primary w-full"} disabled={pending}>
        {pending ? "Sending…" : kind === "STRIKE" ? "Give strike" : "Send to secretariat"}
      </button>
    </form>
  );
}
