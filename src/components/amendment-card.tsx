import { StatusBadge } from "@/components/ui";
import { amendmentRef, resolutionRef } from "@/lib/codes";
import type { AmendmentAction, ReviewStatus } from "@prisma/client";

export const ACTION_LABEL: Record<AmendmentAction, string> = { ADD: "Add", MODIFY: "Modify", STRIKE: "Strike" };

export type AmendmentCardData = {
  id: string;
  number: number;
  clause: string;
  action: AmendmentAction;
  text: string;
  status: ReviewStatus;
  chosen: boolean;
  resolutionRef: string;
  committee: { code: string };
  delegation: { name: string };
  resolution: { number: number } | null;
};

export function amendmentTarget(a: AmendmentCardData) {
  return a.resolution ? resolutionRef(a.committee.code, a.resolution.number) : a.resolutionRef || "Resolution not specified";
}

export function AmendmentCard({ a, children }: { a: AmendmentCardData; children?: React.ReactNode }) {
  return (
    <article className="card overflow-hidden" data-testid="amendment-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-bold text-navy-900">{amendmentRef(a.committee.code, a.number)}</span>
          <span className="badge-blue">{ACTION_LABEL[a.action]}</span>
        </div>
        <StatusBadge status={a.status} chosen={a.chosen} />
      </div>
      <div className="space-y-3 px-5 py-4">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted by</dt><dd className="font-medium">{a.delegation.name}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resolution</dt><dd className="font-medium">{amendmentTarget(a)}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Clause</dt><dd className="font-medium">{a.clause}</dd></div>
        </dl>
        {a.action === "STRIKE" ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">Strike {a.clause.toLowerCase().startsWith("clause") ? a.clause.charAt(0).toLowerCase() + a.clause.slice(1) : a.clause}.</p>
        ) : (
          <blockquote className="whitespace-pre-line rounded-lg border-l-4 border-gold-400 bg-gold-50/60 px-4 py-3 font-serif text-[15px] leading-relaxed">{a.text}</blockquote>
        )}
        {children}
      </div>
    </article>
  );
}
