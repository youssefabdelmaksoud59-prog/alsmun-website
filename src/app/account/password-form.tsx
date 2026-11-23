"use client";

import { useActionState } from "react";
import { changeOwnPassword } from "@/app/actions/auth";
import { Alert } from "@/components/ui";
import { Field, SubmitButton } from "@/components/forms/field";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPassword, null);
  const e = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-4">
      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">{state.message}</Alert>}
      <Field label="Current password" name="current" error={e?.current}><input id="current" name="current" type="password" required className="input" autoComplete="current-password" /></Field>
      <Field label="New password" name="password" error={e?.password} hint="At least 10 characters."><input id="password" name="password" type="password" required minLength={10} className="input" autoComplete="new-password" /></Field>
      <Field label="Confirm new password" name="confirm" error={e?.confirm}><input id="confirm" name="confirm" type="password" required className="input" autoComplete="new-password" /></Field>
      <SubmitButton pending={pending}>Change password</SubmitButton>
    </form>
  );
}
