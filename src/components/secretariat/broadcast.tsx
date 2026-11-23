"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { deleteAnnouncement, deleteCrisisUpdate, postAnnouncement, postCrisisUpdate } from "@/app/actions/broadcast";
import { Alert } from "@/components/ui";
import { Field, SubmitButton } from "@/components/forms/field";

export function AnnouncementForm() {
  const [state, action, pending] = useActionState(postAnnouncement, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  const e = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form ref={ref} action={action} className="space-y-3">
      <Field label="Headline" name="ann-title" error={e?.title}>
        <input id="ann-title" name="title" className="input" required minLength={2} maxLength={140} placeholder="e.g. GA moves to Room 204 after lunch" />
      </Field>
      <Field label={<>Details <span className="font-normal text-slate-500">(optional)</span></>} name="ann-body" error={e?.body}>
        <textarea id="ann-body" name="body" className="input min-h-[70px]" maxLength={1000} placeholder="e.g. Session 3 starts 15 minutes late." />
      </Field>
      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">{state.message}</Alert>}
      <SubmitButton pending={pending} className="btn-gold" pendingText="Sending…">Send to every committee</SubmitButton>
    </form>
  );
}

export function CrisisForm({ committees, defaultAt }: { committees: { id: string; code: string; name: string }[]; defaultAt: string }) {
  const [state, action, pending] = useActionState(postCrisisUpdate, null);
  const [timing, setTiming] = useState<"now" | "later">("now");
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      // Keep the committee selected: crisis staff usually post several updates to the same room.
      const committee = ref.current?.querySelector<HTMLSelectElement>("[name=committeeId]")?.value;
      ref.current?.reset();
      const sel = ref.current?.querySelector<HTMLSelectElement>("[name=committeeId]");
      if (sel && committee) sel.value = committee;
      setTiming("now");
    }
  }, [state]);
  const e = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form ref={ref} action={action} className="space-y-3">
      <Field label="Committee" name="crisis-committee" error={e?.committeeId}>
        <select id="crisis-committee" name="committeeId" className="input" required defaultValue="">
          <option value="" disabled>Choose a committee…</option>
          {committees.map((c) => <option key={c.id} value={c.id}>{c.code}{c.name !== c.code ? ` · ${c.name}` : ""}</option>)}
        </select>
      </Field>
      <Field label="Headline" name="crisis-title" error={e?.title}>
        <input id="crisis-title" name="title" className="input" required minLength={2} maxLength={160} placeholder="e.g. Border clashes reported overnight" />
      </Field>
      <Field label="Update" name="crisis-body" error={e?.body}>
        <textarea id="crisis-body" name="body" className="input min-h-[120px]" required minLength={2} maxLength={5000} />
      </Field>
      <fieldset>
        <legend className="label">When should delegates see it?</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2"><input type="radio" name="timing" value="now" checked={timing === "now"} onChange={() => setTiming("now")} /> Right away</label>
          <label className="inline-flex items-center gap-2"><input type="radio" name="timing" value="later" checked={timing === "later"} onChange={() => setTiming("later")} /> At a set time</label>
        </div>
      </fieldset>
      {timing === "later" && (
        <Field label="Publish at" name="crisis-at" error={e?.publishAt} hint="Conference time. It appears on the committee’s pages automatically.">
          <input id="crisis-at" name="publishAt" type="datetime-local" className="input" required defaultValue={defaultAt} />
        </Field>
      )}
      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">{state.message}</Alert>}
      <SubmitButton pending={pending} className="btn-primary" pendingText="Posting…">{timing === "now" ? "Publish crisis update" : "Schedule crisis update"}</SubmitButton>
    </form>
  );
}

export function DeleteBroadcastButton({ kind, id, label }: { kind: "announcement" | "crisis"; id: string; label: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" disabled={pending} aria-label={`Delete ${label}`}
        onClick={() => {
          if (!window.confirm(`Delete “${label}”? It disappears from every page.`)) return;
          start(async () => {
            const r = kind === "announcement" ? await deleteAnnouncement(id) : await deleteCrisisUpdate(id);
            setError(r.ok ? null : r.error);
          });
        }}>
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </>
  );
}
