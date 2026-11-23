import { formatDateTime } from "@/lib/time";

export type CrisisItem = { id: string; title: string; body: string; publishAt: Date };

/** A committee's crisis updates, newest first. Scheduled (future) items are labelled for staff. */
export function CrisisFeed({ items, empty, actions }: { items: CrisisItem[]; empty: string; actions?: (item: CrisisItem) => React.ReactNode }) {
  if (items.length === 0) return <div className="card px-4 py-8 text-center text-sm text-slate-500">{empty}</div>;
  const now = Date.now();
  return (
    <ol className="space-y-4">
      {items.map((u) => {
        const scheduled = u.publishAt.getTime() > now;
        return (
          <li key={u.id} data-testid="crisis-update" className={`card overflow-hidden border-l-4 ${scheduled ? "border-l-slate-300" : "border-l-red-600"}`}>
            <article className="card-pad">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                {scheduled ? (
                  <span className="badge-neutral">Scheduled · {formatDateTime(u.publishAt)}</span>
                ) : (
                  <span className="font-semibold text-red-700">{formatDateTime(u.publishAt)}</span>
                )}
              </div>
              <h2 className="text-lg font-bold text-navy-950">{u.title}</h2>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{u.body}</p>
              {actions && <div className="mt-3">{actions(u)}</div>}
            </article>
          </li>
        );
      })}
    </ol>
  );
}
