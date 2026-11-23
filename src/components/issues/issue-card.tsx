"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { deleteIssue, setIssueStatus } from "@/app/actions/issues";
import { trackBusy } from "@/components/busy";
import { useHydrated } from "@/components/use-hydrated";

export type IssueView = {
  id: string;
  kind: "STRIKE" | "EQUIPMENT" | "OTHER";
  status: "OPEN" | "RESOLVED";
  committee: string | null;
  delegation: string | null;
  details: string;
  reportedBy: string;
  resolution: string;
  when: string;
  strikeCount?: number;
};

const KIND = {
  STRIKE: { label: "Strike", cls: "bg-red-50 text-red-700 ring-red-200" },
  EQUIPMENT: { label: "Missing equipment", cls: "bg-amber-50 text-amber-800 ring-amber-200" },
  OTHER: { label: "Other problem", cls: "bg-slate-100 text-slate-700 ring-slate-200" },
};

export function IssueCard({ issue, showCommittee, canDelete = true }: { issue: IssueView; showCommittee?: boolean; canDelete?: boolean }) {
  const [isPending, start] = useTransition();
  const hydrated = useHydrated();
  const pending = isPending || !hydrated;
  const [resolving, setResolving] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await trackBusy(fn);
      setError(r.ok ? "" : r.error ?? "Failed.");
      if (r.ok) setResolving(false);
    });
  const k = KIND[issue.kind];
  return (
    <li className={clsx("px-4 py-3", issue.status === "RESOLVED" && "bg-slate-50/70")} data-testid="issue">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`badge ${k.cls}`}>{k.label}</span>
        {showCommittee && <span className="badge-blue">{issue.committee ?? "Whole conference"}</span>}
        {issue.delegation && (
          <span className="font-semibold text-navy-950">
            {issue.delegation}
            {issue.strikeCount ? <span className="ml-1 text-xs font-medium text-red-600">({issue.strikeCount} strike{issue.strikeCount === 1 ? "" : "s"} total)</span> : null}
          </span>
        )}
        <span className="ml-auto">{issue.status === "OPEN" ? <span className="badge-pending">Open</span> : <span className="badge-approved">Resolved</span>}</span>
      </div>
      <p className="mt-1.5 whitespace-pre-line text-sm text-slate-800">{issue.details}</p>
      <p className="mt-1 text-xs text-slate-500">{issue.reportedBy} · {issue.when}</p>
      {issue.status === "RESOLVED" && issue.resolution && (
        <p className="mt-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm text-emerald-900"><span className="font-semibold">Resolution: </span>{issue.resolution}</p>
      )}
      {resolving ? (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder={issue.kind === "STRIKE" ? "e.g. Spoke to the delegate (optional)" : "What was done? (optional)"} aria-label="Resolution note" />
          <button type="button" className="btn-success btn-sm" disabled={pending} onClick={() => run(() => setIssueStatus(issue.id, "RESOLVED", note))}>Mark resolved</button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setResolving(false)}>Cancel</button>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1">
          {issue.status === "OPEN" ? (
            <button type="button" className="btn-outline btn-sm" disabled={pending} onClick={() => setResolving(true)}>{issue.kind === "STRIKE" ? "Mark as handled…" : "Resolve…"}</button>
          ) : (
            <button type="button" className="btn-ghost btn-sm" disabled={pending} onClick={() => run(() => setIssueStatus(issue.id, "OPEN", ""))}>Reopen</button>
          )}
          {canDelete && (
            <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" disabled={pending}
              onClick={() => { if (window.confirm(issue.kind === "STRIKE" ? "Remove this strike? Use this only if it was given by mistake." : "Delete this report?")) run(() => deleteIssue(issue.id)); }}>
              {issue.kind === "STRIKE" ? "Remove strike" : "Delete"}
            </button>
          )}
          {isPending && <span className="self-center text-xs text-slate-500">Saving…</span>}
        </div>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
    </li>
  );
}
