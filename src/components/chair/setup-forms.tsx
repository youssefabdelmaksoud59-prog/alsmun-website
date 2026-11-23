"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addDelegations, deleteDelegation, renameDelegation, updateTopics } from "@/app/actions/chair";
import { Alert } from "@/components/ui";

export function AddDelegationsForm({ committeeId }: { committeeId: string }) {
  const [state, action, pending] = useActionState(addDelegations, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="committeeId" value={committeeId} />
      <div>
        <label htmlFor="names" className="label">Add delegations</label>
        <textarea id="names" name="names" className="input min-h-[140px]" placeholder={"One per line, or separated by commas:\nFrance\nJapan\nUnited States of America"} required />
        <p className="hint">Paste your whole roster at once. Names already on the list are skipped.</p>
      </div>
      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">{state.message}</Alert>}
      <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Adding…" : "Add to roster"}</button>
    </form>
  );
}

export function TopicsForm({ committeeId, topics }: { committeeId: string; topics: string }) {
  const [state, action, pending] = useActionState(updateTopics, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="committeeId" value={committeeId} />
      <div>
        <label htmlFor="topics" className="label">Agenda topics</label>
        <textarea id="topics" name="topics" className="input min-h-[100px]" defaultValue={topics} placeholder={"One topic per line, e.g.\nThe question of climate refugees"} />
        <p className="hint">Delegates pick one of these when they submit a resolution.</p>
      </div>
      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">{state.message}</Alert>}
      <button type="submit" className="btn-outline" disabled={pending}>{pending ? "Saving…" : "Save topics"}</button>
    </form>
  );
}

export function DelegationRow({ id, name, locked }: { id: string; name: string; locked: boolean }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <li className="px-4 py-2.5" data-testid="delegation-row">
      {editing ? (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await renameDelegation(id, value);
              if (r.ok) { setEditing(false); setError(""); } else setError(r.error);
            });
          }}
        >
          <input className="input" value={value} onChange={(e) => setValue(e.target.value)} maxLength={80} aria-label={`New name for ${name}`} autoFocus />
          <button type="submit" className="btn-primary btn-sm" disabled={pending}>Save</button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => { setEditing(false); setValue(name); }}>Cancel</button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{name}</span>
          <span className="flex gap-1">
            <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(true)}>Rename</button>
            <button
              type="button"
              className="btn-ghost btn-sm text-red-600 hover:bg-red-50 disabled:text-slate-400"
              disabled={pending || locked}
              title={locked ? "Has submissions or points, so it can’t be removed" : undefined}
              onClick={() => {
                if (!window.confirm(`Remove ${name} from the roster?`)) return;
                start(async () => {
                  const r = await deleteDelegation(id);
                  if (!r.ok) setError(r.error);
                });
              }}
            >
              Remove
            </button>
          </span>
        </div>
      )}
      {error && <p className="field-error">{error}</p>}
    </li>
  );
}
