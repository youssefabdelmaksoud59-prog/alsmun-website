"use client";

import { useState, useTransition } from "react";
import { reviewSubmission, setChosen } from "@/app/actions/chair";
import type { ReviewStatus } from "@prisma/client";
import { useHydrated } from "@/components/use-hydrated";
import { trackBusy } from "@/components/busy";

export function ReviewActions({
  kind,
  id,
  status,
  chosen,
  note,
}: {
  kind: "resolution" | "amendment";
  id: string;
  status: ReviewStatus;
  chosen: boolean;
  note: string;
}) {
  const [isPending, start] = useTransition();
  const hydrated = useHydrated();
  const pending = isPending || !hydrated;
  const [error, setError] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [draft, setDraft] = useState(note);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError("");
      const r = await trackBusy(fn);
      if (!r.ok) setError(r.error ?? "Something went wrong.");
      else setShowNote(false);
    });

  return (
    <div className="space-y-3 border-t border-slate-100 pt-3">
      {note && !showNote && (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="font-semibold">Note to delegate: </span>{note}</p>
      )}
      {showNote && (
        <div>
          <label htmlFor={`note-${id}`} className="label">Note to the delegate <span className="font-normal text-slate-500">(shown on their tracking page)</span></label>
          <textarea id={`note-${id}`} className="input min-h-[70px]" maxLength={1000} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="e.g. Clause 3 is out of the committee’s mandate." />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn-danger btn-sm" disabled={pending} onClick={() => run(() => reviewSubmission(kind, id, "REJECTED", draft))}>Reject with note</button>
            {status !== "REJECTED" && (
              <button type="button" className="btn-outline btn-sm" disabled={pending} onClick={() => run(() => reviewSubmission(kind, id, status, draft))}>Save note only</button>
            )}
            <button type="button" className="btn-ghost btn-sm" onClick={() => setShowNote(false)}>Cancel</button>
          </div>
        </div>
      )}
      {!showNote && (
        <div className="flex flex-wrap gap-2">
          {status !== "APPROVED" && (
            <button type="button" className="btn-success btn-sm" disabled={pending} onClick={() => run(() => reviewSubmission(kind, id, "APPROVED", note))}>Approve</button>
          )}
          {status !== "REJECTED" && !chosen && (
            <button type="button" className="btn-outline btn-sm" disabled={pending} onClick={() => setShowNote(true)}>Reject…</button>
          )}
          {chosen ? (
            <button type="button" className="btn-outline btn-sm" disabled={pending} onClick={() => run(() => setChosen(kind, id, false))}>Remove from debate (−3 pts)</button>
          ) : (
            status !== "REJECTED" && (
              <button type="button" className="btn-gold btn-sm" disabled={pending} onClick={() => run(() => setChosen(kind, id, true))}>
                ★ {status === "PENDING" ? "Approve & choose" : "Choose for debate"} (+3 pts)
              </button>
            )
          )}
          {status !== "PENDING" && !chosen && (
            <button type="button" className="btn-ghost btn-sm" disabled={pending} onClick={() => run(() => reviewSubmission(kind, id, "PENDING", note))}>Move back to review</button>
          )}
          {status !== "REJECTED" && !chosen && (
            <button type="button" className="btn-ghost btn-sm" disabled={pending} onClick={() => setShowNote(true)}>{note ? "Edit note" : "Add note"}</button>
          )}
          {isPending && <span className="self-center text-xs text-slate-500">Saving…</span>}
        </div>
      )}
      {error && <p className="text-sm font-medium text-red-600" role="alert">{error}</p>}
    </div>
  );
}
