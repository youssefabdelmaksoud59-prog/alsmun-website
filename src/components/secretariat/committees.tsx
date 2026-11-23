"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { deleteCommittee, saveCommittee } from "@/app/actions/secretariat";
import { Alert } from "@/components/ui";
import { Field } from "@/components/forms/field";

type C = { id: string; code: string; name: string; topics: string; sortOrder: number };

export function CommitteeForm({ committee, onDone }: { committee?: C; onDone?: () => void }) {
  const [state, action, pending] = useActionState(saveCommittee, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      if (!committee) ref.current?.reset();
      onDone?.();
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps
  const e = state && !state.ok ? state.fieldErrors : undefined;
  const p = committee?.id ?? "new";
  return (
    <form ref={ref} action={action} className="space-y-3">
      {committee && <input type="hidden" name="id" value={committee.id} />}
      <div className="grid grid-cols-[1fr_90px] gap-3">
        <Field label="Code" name={`code-${p}`} error={e?.code}>
          <input id={`code-${p}`} name="code" className="input uppercase" defaultValue={committee?.code} required maxLength={16} placeholder="e.g. HRC" />
        </Field>
        <Field label="Order" name={`order-${p}`} error={e?.sortOrder}>
          <input id={`order-${p}`} name="sortOrder" type="number" min={0} max={999} className="input" defaultValue={committee?.sortOrder ?? 0} />
        </Field>
      </div>
      <Field label="Full name" name={`name-${p}`} error={e?.name}>
        <input id={`name-${p}`} name="name" className="input" defaultValue={committee?.name} required maxLength={120} placeholder="e.g. Human Rights Council" />
      </Field>
      <Field label="Agenda topics" name={`topics-${p}`} hint="One per line.">
        <textarea id={`topics-${p}`} name="topics" className="input min-h-[70px]" defaultValue={committee?.topics} />
      </Field>
      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && !committee && <Alert kind="success">{state.message}</Alert>}
      <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Saving…" : committee ? "Save" : "Add committee"}</button>
    </form>
  );
}

export function CommitteeRow({ committee, counts }: { committee: C; counts: string }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <li className="px-4 py-3">
      {editing ? (
        <div>
          <CommitteeForm committee={committee} onDone={() => setEditing(false)} />
          <button type="button" className="btn-ghost btn-sm mt-2" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex min-w-[4.5rem] justify-center rounded-md bg-navy-900 px-2 py-1 text-xs font-bold text-gold-300">{committee.code}</span>
          <div className="min-w-0 flex-1">
            <div className="font-medium">{committee.name}</div>
            <div className="text-xs text-slate-500">{counts}{committee.topics ? ` · ${committee.topics.split("\n").length} topic(s)` : " · no topics"}</div>
          </div>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
          <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" disabled={pending}
            onClick={() => {
              if (!window.confirm(`Delete ${committee.code}? Its roster, schedule items and attendance will be deleted too.`)) return;
              start(async () => {
                const r = await deleteCommittee(committee.id);
                if (!r.ok) setError(r.error);
              });
            }}>
            Delete
          </button>
        </div>
      )}
      {error && <p className="field-error">{error}</p>}
    </li>
  );
}
