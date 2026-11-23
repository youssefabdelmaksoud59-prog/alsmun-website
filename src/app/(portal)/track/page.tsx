import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { normaliseCode, amendmentRef, resolutionRef } from "@/lib/codes";
import { Alert, PageHeader, StatusBadge } from "@/components/ui";
import { SavedSubmissions } from "@/components/portal/saved-submissions";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Track a submission" };
export const dynamic = "force-dynamic";

async function lookup(code: string) {
  if (code.startsWith("R-")) {
    const r = await db.resolution.findUnique({ where: { trackingCode: code }, include: { committee: true, delegation: true } });
    if (!r) return null;
    return { kind: "Resolution", ref: resolutionRef(r.committee.code, r.number), status: r.status, chosen: r.chosen, note: r.chairNote, delegation: r.delegation.name, createdAt: r.createdAt, link: r.status === "APPROVED" ? `/delegate/${encodeURIComponent(r.committee.code)}/resolutions/${r.id}` : null };
  }
  if (code.startsWith("A-")) {
    const a = await db.amendment.findUnique({ where: { trackingCode: code }, include: { committee: true, delegation: true } });
    if (!a) return null;
    return { kind: "Amendment", ref: amendmentRef(a.committee.code, a.number), status: a.status, chosen: a.chosen, note: a.chairNote, delegation: a.delegation.name, createdAt: a.createdAt, link: a.status === "APPROVED" ? `/delegate/${encodeURIComponent(a.committee.code)}/amendments` : null };
  }
  return null;
}

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code: raw } = await searchParams;
  const code = raw ? normaliseCode(raw) : "";
  const result = code ? await lookup(code) : null;
  return (
    <div className="container-page max-w-2xl">
      <PageHeader eyebrow="Delegate" title="Track a submission" description="Enter the tracking code you got when you submitted, to see whether your chairs have reviewed it." />
      <form className="card card-pad flex flex-col gap-3 sm:flex-row sm:items-end" action="/track">
        <div className="flex-1">
          <label htmlFor="code" className="label">Tracking code</label>
          <input id="code" name="code" defaultValue={code} className="input font-mono uppercase tracking-wider" placeholder="R-ABCD-EFGH" autoCapitalize="characters" autoComplete="off" required />
        </div>
        <button className="btn-primary" type="submit">Check status</button>
      </form>

      {code && !result && <div className="mt-4"><Alert kind="error">We couldn’t find a submission with code <strong className="font-mono">{code}</strong>. Check it and try again.</Alert></div>}

      {result && (
        <div className="card card-pad mt-4" data-testid="track-result">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{result.kind}</p>
              <p className="font-mono text-lg font-bold text-navy-950">{result.ref}</p>
            </div>
            <StatusBadge status={result.status} chosen={result.chosen} />
          </div>
          <p className="mt-2 text-sm text-slate-600">Submitted by {result.delegation} · {formatDateTime(result.createdAt)}</p>
          {result.note && (
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="font-semibold">Chair’s note: </span>{result.note}</div>
          )}
          {result.status === "PENDING" && <p className="mt-3 text-sm text-slate-600">Your chairs haven’t reviewed this yet. Check again in a few minutes.</p>}
          {result.status === "REJECTED" && <p className="mt-3 text-sm text-slate-600">You can fix it and submit it again as a new submission.</p>}
          {result.link && <Link href={result.link} className="btn-outline btn-sm mt-4">View it</Link>}
        </div>
      )}

      <SavedSubmissions />
    </div>
  );
}
