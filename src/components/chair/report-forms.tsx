"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { deleteReport, uploadReport } from "@/app/actions/chair";
import { Alert } from "@/components/ui";

export function UploadReportForm({ committeeId }: { committeeId: string }) {
  const [state, action, pending] = useActionState(uploadReport, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-4">
      <input type="hidden" name="committeeId" value={committeeId} />
      <div>
        <label htmlFor="title" className="label">Title</label>
        <input id="title" name="title" className="input" maxLength={120} placeholder="e.g. Chair report: Topic 1" />
        <p className="hint">Leave empty to use the file name.</p>
      </div>
      <div>
        <label htmlFor="file" className="label">File</label>
        <input id="file" name="file" type="file" required accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-navy-800 hover:file:bg-navy-100" />
        <p className="hint">PDF, Word, PowerPoint, Excel, text or image. Up to 4 MB.</p>
      </div>
      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">{state.message}</Alert>}
      <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Uploading…" : "Upload report"}</button>
    </form>
  );
}

export function DeleteReportButton({ id, title }: { id: string; title: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <>
      <button
        type="button"
        className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Delete “${title}”? Delegates will no longer be able to download it.`)) return;
          start(async () => {
            const r = await deleteReport(id);
            if (!r.ok) setError(r.error);
          });
        }}
      >
        Delete
      </button>
      {error && <span className="field-error">{error}</span>}
    </>
  );
}
