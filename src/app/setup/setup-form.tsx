"use client";

import { useActionState } from "react";
import { setupCodes } from "@/app/actions/auth";
import { Alert } from "@/components/ui";
import { Field, SubmitButton } from "@/components/forms/field";

export function SetupForm({ ownerOnly }: { ownerOnly: boolean }) {
  const [state, action, pending] = useActionState(setupCodes, null);
  const e = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-4">
      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}
      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-bold text-navy-950">Owner code (only you)</legend>
        <Field label="Owner code" name="ownerCode" error={e?.ownerCode} hint="At least 6 characters. Don’t share it with anyone.">
          <input id="ownerCode" name="ownerCode" type="password" required minLength={6} className="input font-mono" autoComplete="new-password" />
        </Field>
        <Field label="Type it again" name="ownerConfirm">
          <input id="ownerConfirm" name="ownerConfirm" type="password" required className="input font-mono" autoComplete="new-password" />
        </Field>
      </fieldset>
      {!ownerOnly && (
        <fieldset className="space-y-4 border-t border-slate-100 pt-4">
          <legend className="mb-2 pt-4 text-sm font-bold text-navy-950">Secretariat code (for your secretariat team)</legend>
          <Field label="Secretariat code" name="code" error={e?.code} hint="At least 6 characters, and different from the owner code.">
            <input id="code" name="code" type="password" required minLength={6} className="input font-mono" autoComplete="new-password" />
          </Field>
          <Field label="Type it again" name="confirm">
            <input id="confirm" name="confirm" type="password" required className="input font-mono" autoComplete="new-password" />
          </Field>
        </fieldset>
      )}
      <SubmitButton pending={pending} className="btn-gold w-full" pendingText="Saving…">{ownerOnly ? "Set owner code" : "Save codes"}</SubmitButton>
    </form>
  );
}
