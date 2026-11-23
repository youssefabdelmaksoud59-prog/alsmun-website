"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { deleteScheduleItem, saveScheduleItem } from "@/app/actions/secretariat";
import { Alert } from "@/components/ui";
import { Field } from "@/components/forms/field";

type Committee = { id: string; code: string };
export type ScheduleFormItem = { id: string; title: string; description: string; location: string; committeeId: string | null; startsAt: string; endsAt: string };

export function ScheduleForm({ committees, item, onDone, defaultStart }: { committees: Committee[]; item?: ScheduleFormItem; onDone?: () => void; defaultStart?: string }) {
  const [state, action, pending] = useActionState(saveScheduleItem, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      if (!item) {
        const start = ref.current?.querySelector<HTMLInputElement>("[name=startsAt]")?.value;
        const end = ref.current?.querySelector<HTMLInputElement>("[name=endsAt]")?.value;
        ref.current?.reset();
        // Chain the next item from the previous one's end time, which is how schedules are usually typed in.
        const next = end || start;
        const s = ref.current?.querySelector<HTMLInputElement>("[name=startsAt]");
        if (s && next) s.value = next;
      }
      onDone?.();
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps
  const e = state && !state.ok ? state.fieldErrors : undefined;
  const p = item?.id ?? "new";
  return (
    <form ref={ref} action={action} className="space-y-3">
      {item && <input type="hidden" name="id" value={item.id} />}
      <Field label="Title" name={`title-${p}`} error={e?.title}>
        <input id={`title-${p}`} name="title" className="input" defaultValue={item?.title} required maxLength={120} placeholder="e.g. Committee session 2" />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Starts" name={`start-${p}`} error={e?.startsAt}>
          <input id={`start-${p}`} name="startsAt" type="datetime-local" className="input" defaultValue={item?.startsAt ?? defaultStart} required />
        </Field>
        <Field label={<>Ends <span className="font-normal text-slate-500">(optional)</span></>} name={`end-${p}`} error={e?.endsAt}>
          <input id={`end-${p}`} name="endsAt" type="datetime-local" className="input" defaultValue={item?.endsAt} />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="For" name={`committee-${p}`}>
          <select id={`committee-${p}`} name="committeeId" className="input" defaultValue={item?.committeeId ?? ""}>
            <option value="">All delegates</option>
            {committees.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </Field>
        <Field label={<>Location <span className="font-normal text-slate-500">(optional)</span></>} name={`location-${p}`}>
          <input id={`location-${p}`} name="location" className="input" defaultValue={item?.location} maxLength={120} placeholder="e.g. Main hall" />
        </Field>
      </div>
      <Field label={<>Details <span className="font-normal text-slate-500">(optional)</span></>} name={`desc-${p}`}>
        <textarea id={`desc-${p}`} name="description" className="input min-h-[60px]" defaultValue={item?.description} maxLength={1000} />
      </Field>
      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && !item && <Alert kind="success">{state.message}</Alert>}
      <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Saving…" : item ? "Save" : "Add to schedule"}</button>
    </form>
  );
}

export function ScheduleRow({ item, committees, when, forLabel }: { item: ScheduleFormItem; committees: Committee[]; when: string; forLabel: string }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  return (
    <li className="px-4 py-3">
      {editing ? (
        <div>
          <ScheduleForm committees={committees} item={item} onDone={() => setEditing(false)} />
          <button type="button" className="btn-ghost btn-sm mt-2" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-28 shrink-0 text-sm font-bold tabular-nums text-navy-900">{when}</div>
          <div className="min-w-0 flex-1">
            <div className="font-medium">{item.title}</div>
            <div className="text-xs text-slate-500">{[forLabel, item.location].filter(Boolean).join(" · ")}</div>
          </div>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
          <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" disabled={pending}
            onClick={() => { if (window.confirm(`Delete “${item.title}”?`)) start(async () => { await deleteScheduleItem(item.id); }); }}>
            Delete
          </button>
        </div>
      )}
    </li>
  );
}
