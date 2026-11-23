"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { createUser, deleteUser, resetUserPassword, updateUser } from "@/app/actions/secretariat";
import { Alert } from "@/components/ui";
import { Field } from "@/components/forms/field";

type Committee = { id: string; code: string; name: string };

export function CreateUserForm({ committees }: { committees: Committee[] }) {
  const [state, action, pending] = useActionState(createUser, null);
  const [role, setRole] = useState<"CHAIR" | "SECRETARIAT">("CHAIR");
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  const e = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form ref={ref} action={action} className="space-y-4">
      <h2 className="text-base font-bold">Add an account</h2>
      <Field label="Name" name="name" error={e?.name}><input id="name" name="name" className="input" required maxLength={80} /></Field>
      <Field label="Email" name="email" error={e?.email}><input id="email" name="email" type="email" className="input" required /></Field>
      <fieldset>
        <legend className="label">Role</legend>
        <div className="flex gap-2">
          {(["CHAIR", "SECRETARIAT"] as const).map((r) => (
            <label key={r} className={`flex-1 cursor-pointer rounded-lg border-2 px-3 py-2 text-center text-sm font-semibold ${role === r ? "border-navy-600 bg-navy-50" : "border-slate-200"}`}>
              <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
              {r === "CHAIR" ? "Chair" : "Secretariat"}
            </label>
          ))}
        </div>
      </fieldset>
      {role === "CHAIR" && (
        <Field label="Committee" name="committeeId" error={e?.committeeId}>
          <select id="committeeId" name="committeeId" className="input" required>
            <option value="">Choose…</option>
            {committees.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
          </select>
        </Field>
      )}
      <Field label={<>Password <span className="font-normal text-slate-500">(optional)</span></>} name="password" error={e?.password} hint="Leave empty to generate a secure one.">
        <input id="password" name="password" type="text" className="input font-mono" autoComplete="off" minLength={10} />
      </Field>
      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && (
        <Alert kind="success">
          <p className="font-semibold">{state.message?.split(" Password:")[0]}</p>
          <p className="mt-1">Password: <code className="select-all rounded bg-white px-1.5 py-0.5 font-mono" data-testid="new-password">{String(state.data?.password ?? "")}</code></p>
          <p className="mt-1 text-xs">Share it privately. It won’t be shown again; they can change it under Account.</p>
        </Alert>
      )}
      <button type="submit" className="btn-primary w-full" disabled={pending}>{pending ? "Creating…" : "Create account"}</button>
    </form>
  );
}

type UserRow = { id: string; name: string; email: string; role: "CHAIR" | "SECRETARIAT"; active: boolean; committeeId: string | null; isMe: boolean };

export function UserRowControls({ user, committees }: { user: UserRow; committees: Committee[] }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? (r.message ? { kind: "success", text: r.message } : null) : { kind: "error", text: r.error ?? "Failed." });
    });
  return (
    <li className={`px-4 py-3 ${user.active ? "" : "bg-slate-50 opacity-70"}`} data-testid="user-row">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-navy-950">{user.name}</span>
            <span className={user.role === "SECRETARIAT" ? "badge-chosen" : "badge-blue"}>{user.role === "SECRETARIAT" ? "Secretariat" : "Chair"}</span>
            {!user.active && <span className="badge-rejected">Disabled</span>}
            {user.isMe && <span className="badge-neutral">You</span>}
          </div>
          <div className="truncate text-xs text-slate-500">{user.email}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="input w-auto py-1.5 text-sm"
            aria-label={`Committee for ${user.name}`}
            value={user.committeeId ?? ""}
            disabled={pending}
            onChange={(e) => run(() => updateUser(user.id, { committeeId: e.target.value || null }))}
          >
            <option value="">{user.role === "SECRETARIAT" ? "All committees" : "No committee"}</option>
            {committees.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
          {!user.isMe && (
            <>
              <button type="button" className="btn-ghost btn-sm" disabled={pending} onClick={() => run(() => updateUser(user.id, { role: user.role === "CHAIR" ? "SECRETARIAT" : "CHAIR" }))}>
                Make {user.role === "CHAIR" ? "secretariat" : "chair"}
              </button>
              <button type="button" className="btn-ghost btn-sm" disabled={pending} onClick={() => run(() => updateUser(user.id, { active: !user.active }))}>
                {user.active ? "Disable" : "Enable"}
              </button>
            </>
          )}
          <button type="button" className="btn-ghost btn-sm" disabled={pending}
            onClick={() => { if (window.confirm(`Reset the password for ${user.name}? Their current password stops working.`)) run(() => resetUserPassword(user.id)); }}>
            Reset password
          </button>
          {!user.isMe && (
            <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" disabled={pending}
              onClick={() => { if (window.confirm(`Delete ${user.name}’s account? This can’t be undone.`)) run(() => deleteUser(user.id)); }}>
              Delete
            </button>
          )}
        </div>
      </div>
      {msg && <p className={`mt-2 text-sm ${msg.kind === "error" ? "text-red-600" : "text-emerald-700"}`} role="status"><span className="select-all font-mono">{msg.text}</span></p>}
    </li>
  );
}
