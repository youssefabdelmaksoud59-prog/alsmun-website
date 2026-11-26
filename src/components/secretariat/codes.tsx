"use client";

import { useActionState, useState, useTransition } from "react";
import { generateChairCode, setChairCode } from "@/app/actions/secretariat";
import { changeOwnerCode, changeSecretariatCode } from "@/app/actions/auth";
import { Alert } from "@/components/ui";
import { Field } from "@/components/forms/field";
import { useHydrated } from "@/components/use-hydrated";

export function ChairCodeRow({ committee }: { committee: { id: string; code: string; name: string; chairCode: string | null } }) {
  const [value, setValue] = useState(committee.chairCode ?? "");
  const [isPending, start] = useTransition();
  const hydrated = useHydrated();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = value.trim() !== (committee.chairCode ?? "");
  const save = () =>
    start(async () => {
      const r = await setChairCode(committee.id, value);
      setMsg(r.ok ? { ok: true, text: r.message ?? "Saved." } : { ok: false, text: r.error });
    });
  return (
    <li className="px-4 py-3" data-testid="chair-code-row">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-2 sm:w-56">
          <span className="inline-flex min-w-[4.5rem] justify-center rounded-md bg-navy-900 px-2 py-1 text-xs font-bold text-gold-300">{committee.code}</span>
          <span className="truncate text-sm text-slate-600">{committee.name}</span>
        </div>
        <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <input className="input font-mono" value={value} onChange={(e) => { setValue(e.target.value); setMsg(null); }} maxLength={64}
            placeholder="No code yet" aria-label={`Chair code for ${committee.code}`} autoComplete="off" spellCheck={false} />
          <button type="button" className="btn-ghost btn-sm shrink-0" disabled={!hydrated || isPending}
            onClick={() => start(async () => { setValue(await generateChairCode()); setMsg(null); })}>Generate</button>
          <button type="submit" className="btn-primary btn-sm shrink-0" disabled={!hydrated || isPending || !dirty}>Save</button>
        </form>
      </div>
      {!committee.chairCode && !msg && <p className="mt-1 text-xs text-amber-700">No chair code yet, so this committee’s chairs can’t sign in.</p>}
      {msg && <p className={`mt-1 text-xs ${msg.ok ? "text-emerald-700" : "text-red-600"}`} role="status">{msg.text}</p>}
    </li>
  );
}

export function SecretariatCodeForm() {
  const [state, action, pending] = useActionState(changeSecretariatCode, null);
  const e = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-3">
      <h2 className="text-base font-bold">Change the secretariat code</h2>
      <Field label="New secretariat code" name="sec-code" error={e?.code} hint="At least 6 characters. Everyone using the old code is signed out.">
        <input id="sec-code" name="code" type="password" className="input font-mono" required minLength={6} autoComplete="new-password" />
      </Field>
      <Field label="Type it again" name="sec-confirm">
        <input id="sec-confirm" name="confirm" type="password" className="input font-mono" required autoComplete="new-password" />
      </Field>
      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">{state.message}</Alert>}
      <button type="submit" className="btn-gold" disabled={pending}>{pending ? "Saving…" : "Change secretariat code"}</button>
    </form>
  );
}

export function OwnerCodeForm() {
  const [state, action, pending] = useActionState(changeOwnerCode, null);
  const e = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-3">
      <h2 className="text-base font-bold">Change your owner code</h2>
      <Field label="New owner code" name="own-code" error={e?.code} hint="At least 6 characters. Only you should know it.">
        <input id="own-code" name="code" type="password" className="input font-mono" required minLength={6} autoComplete="new-password" />
      </Field>
      <Field label="Type it again" name="own-confirm">
        <input id="own-confirm" name="confirm" type="password" className="input font-mono" required autoComplete="new-password" />
      </Field>
      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">{state.message}</Alert>}
      <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Change owner code"}</button>
    </form>
  );
}
