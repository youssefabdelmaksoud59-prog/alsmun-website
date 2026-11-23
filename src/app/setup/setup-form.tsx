"use client";

import { useActionState } from "react";
import { setupFirstAccount } from "@/app/actions/auth";
import { Alert } from "@/components/ui";
import { Field, SubmitButton } from "@/components/forms/field";

export function SetupForm() {
  const [state, action, pending] = useActionState(setupFirstAccount, null);
  const e = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-4">
      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}
      <Field label="Your name" name="name" error={e?.name}><input id="name" name="name" required className="input" autoComplete="name" /></Field>
      <Field label="Email" name="email" error={e?.email}><input id="email" name="email" type="email" required className="input" autoComplete="username" /></Field>
      <Field label="Password" name="password" error={e?.password} hint="At least 10 characters."><input id="password" name="password" type="password" required minLength={10} className="input" autoComplete="new-password" /></Field>
      <Field label="Confirm password" name="confirm" error={e?.confirm}><input id="confirm" name="confirm" type="password" required className="input" autoComplete="new-password" /></Field>
      <SubmitButton pending={pending} className="btn-gold w-full" pendingText="Creating…">Create secretariat account</SubmitButton>
    </form>
  );
}
