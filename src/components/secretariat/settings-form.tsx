"use client";

import { useActionState } from "react";
import { saveSettings } from "@/app/actions/secretariat";
import { Alert } from "@/components/ui";
import { Field } from "@/components/forms/field";
import type { ConferenceSettings } from "@/lib/settings";

export function SettingsForm({ settings }: { settings: ConferenceSettings }) {
  const [state, action, pending] = useActionState(saveSettings, null);
  const e = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-4">
      <Field label="Conference name" name="conferenceName" error={e?.conferenceName}>
        <input id="conferenceName" name="conferenceName" className="input" defaultValue={settings.conferenceName} maxLength={60} required />
      </Field>
      <Field label="Tagline" name="tagline"><input id="tagline" name="tagline" className="input" defaultValue={settings.tagline} maxLength={160} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Dates" name="dates" hint="Shown on the home page, e.g. 12–14 December 2026"><input id="dates" name="dates" className="input" defaultValue={settings.dates} maxLength={80} /></Field>
        <Field label="Venue" name="venue"><input id="venue" name="venue" className="input" defaultValue={settings.venue} maxLength={120} /></Field>
      </div>
      <Field label="Announcement banner" name="announcement" hint="Shown at the top of the home page. Leave empty to hide it.">
        <textarea id="announcement" name="announcement" className="input min-h-[80px]" defaultValue={settings.announcement} maxLength={600} />
      </Field>
      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">{state.message}</Alert>}
      <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Save settings"}</button>
    </form>
  );
}
