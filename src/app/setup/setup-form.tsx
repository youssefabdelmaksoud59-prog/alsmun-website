"use client";

import { useActionState } from "react";
import { setupSecretariatCode } from "@/app/actions/auth";
import { Alert } from "@/components/ui";
import { Field, SubmitButton } from "@/components/forms/field";

export function SetupForm() {
  const [state, action, pending] = useActionState(setupSecretariatCode, null);
  const e = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-4">
      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}
      <Field label="Secretariat code" name="code" error={e?.code} hint="At least 6 characters. Only the secretariat should know it.">
        <input id="code" name="code" type="password" required minLength={6} className="input font-mono" autoComplete="new-password" />
      </Field>
      <Field label="Type it again" name="confirm">
        <input id="confirm" name="confirm" type="password" required className="input font-mono" autoComplete="new-password" />
      </Field>
      <SubmitButton pending={pending} className="btn-gold w-full" pendingText="Saving…">Set secretariat code</SubmitButton>
    </form>
  );
}
