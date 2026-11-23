"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Alert } from "@/components/ui";
import { Field, SubmitButton } from "@/components/forms/field";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}
      <Field label="Email" name="email">
        <input id="email" name="email" type="email" autoComplete="username" required className="input" />
      </Field>
      <Field label="Password" name="password">
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </Field>
      <SubmitButton pending={pending} className="btn-primary w-full" pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
