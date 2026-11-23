import clsx from "clsx";
import { STRIKE_ALERT } from "@/lib/issues";

export function StrikeSummary({ rows, showCommittee }: { rows: { delegationId: string; name: string; committee: string; count: number }[]; showCommittee?: boolean }) {
  return (
    <section className="card overflow-hidden" aria-labelledby="strikes-h">
      <h2 id="strikes-h" className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Strikes by delegation</h2>
      {rows.length === 0 ? (
        <p className="px-4 py-4 text-sm text-slate-500">No strikes given.</p>
      ) : (
        <ul className="divide-y divide-slate-100" data-testid="strike-summary">
          {rows.map((r) => (
            <li key={r.delegationId} className={clsx("flex items-center gap-3 px-4 py-2 text-sm", r.count >= STRIKE_ALERT && "bg-red-50")}>
              {showCommittee && <span className="w-16 shrink-0 text-xs font-bold text-navy-700">{r.committee}</span>}
              <span className="flex-1 font-medium">{r.name}</span>
              <span className={clsx("font-bold tabular-nums", r.count >= STRIKE_ALERT ? "text-red-700" : "text-navy-900")}>
                {r.count} {r.count >= STRIKE_ALERT ? "⚠" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
