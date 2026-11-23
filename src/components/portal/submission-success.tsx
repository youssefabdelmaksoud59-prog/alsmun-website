"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addSubmission } from "./storage";

export function SubmissionSuccess({
  kind,
  code,
  reference,
  onAnother,
}: {
  kind: "Resolution" | "Amendment";
  code: string;
  reference: string;
  onAnother: () => void;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    addSubmission({ code, reference, kind, at: new Date().toISOString() });
  }, [code, reference, kind]);

  return (
    <div className="card card-pad text-center" role="status" aria-live="polite">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L19 7" /></svg>
      </div>
      <h2 className="text-xl font-bold">{kind} submitted</h2>
      <p className="mt-1 text-sm text-slate-600">
        Your chairs will review <strong>{reference}</strong>. Keep this tracking code to check its status.
      </p>
      <div className="mx-auto mt-5 flex max-w-xs items-center justify-between gap-2 rounded-xl border-2 border-dashed border-gold-400 bg-gold-50 px-4 py-3">
        <span className="font-mono text-xl font-bold tracking-wider text-navy-950" data-testid="tracking-code">{code}</span>
        <button
          type="button"
          className="btn-outline btn-sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* clipboard blocked */
            }
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">It is also saved on this device under “Track a submission”.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={`/track?code=${encodeURIComponent(code)}`} className="btn-primary">Check status</Link>
        <button type="button" className="btn-outline" onClick={onAnother}>Submit another</button>
      </div>
    </div>
  );
}
