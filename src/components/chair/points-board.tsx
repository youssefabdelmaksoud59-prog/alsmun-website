"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { addScore, deleteScore } from "@/app/actions/chair";
import { POINTS } from "@/lib/scoring";
import { trackBusy } from "@/components/busy";

type Row = { id: string; name: string; poi: number; speech: number; total: number };
type Recent = { id: string; delegation: string; type: string; points: number; at: string; linked: boolean };
type Op = { delegationId: string; type: "POI" | "SPEECH" };

const TYPE_LABEL: Record<string, string> = { POI: "POI", SPEECH: "Speech", AMENDMENT: "Amendment chosen", RESOLUTION: "Resolution chosen" };

export function PointsBoard({ committeeId, rows, recent }: { committeeId: string; rows: Row[]; recent: Recent[] }) {
  const [optimistic, apply] = useOptimistic(rows, (state: Row[], op: Op) =>
    state.map((r) =>
      r.id === op.delegationId
        ? { ...r, poi: r.poi + (op.type === "POI" ? 1 : 0), speech: r.speech + (op.type === "SPEECH" ? 1 : 0), total: r.total + POINTS[op.type] }
        : r,
    ),
  );
  const [, start] = useTransition();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "total">("name");
  const [error, setError] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = optimistic.filter((r) => !q || r.name.toLowerCase().includes(q));
    return [...filtered].sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : b.total - a.total || a.name.localeCompare(b.name)));
  }, [optimistic, query, sort]);

  const add = (delegationId: string, type: "POI" | "SPEECH") => {
    start(async () => {
      apply({ delegationId, type });
      const r = await trackBusy(() => addScore(committeeId, delegationId, type));
      if (!r.ok) setError(r.error);
      else setError("");
    });
  };
  const undo = (id: string) =>
    start(async () => {
      const r = await trackBusy(() => deleteScore(id));
      if (!r.ok) setError(r.error);
      else setError("");
    });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input type="search" className="input sm:max-w-xs" placeholder="Find a delegation…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Find a delegation" />
          <div className="flex shrink-0 gap-1 self-start rounded-lg bg-slate-200/70 p-1 text-sm font-semibold sm:self-auto">
            {(["name", "total"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setSort(s)} className={`whitespace-nowrap rounded-md px-3 py-1 ${sort === s ? "bg-white shadow" : "text-slate-600"}`}>
                {s === "name" ? "A–Z" : "Highest first"}
              </button>
            ))}
          </div>
          </div>
        <p className="-mt-2 mb-4 text-xs text-slate-500">POI = 1 pt (follow-ups don’t count) · Speech = 2 pts · Amendment or resolution chosen for debate = 3 pts (awarded automatically)</p>
        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
        {rows.length === 0 ? (
          <p className="card card-pad text-sm text-slate-500">Add delegations on the “Delegations & topics” tab to start tallying.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {list.map((r) => (
              <li key={r.id} className="card flex items-center gap-3 p-3" data-testid="points-row">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-navy-950">{r.name}</div>
                  <div className="text-xs tabular-nums text-slate-500">{r.poi} POI · {r.speech} speech{r.speech === 1 ? "" : "es"}</div>
                </div>
                <div className="w-12 text-right text-lg font-bold tabular-nums text-navy-900" aria-label={`${r.total} points`} data-testid="points-total">{r.total}</div>
                <button type="button" onClick={() => add(r.id, "POI")} className="btn-outline h-12 w-14 flex-col gap-0 px-0 text-xs" aria-label={`Add POI for ${r.name}`}>
                  <span className="text-base leading-none">+1</span><span className="text-[10px] font-medium text-slate-500">POI</span>
                </button>
                <button type="button" onClick={() => add(r.id, "SPEECH")} className="btn-primary h-12 w-14 flex-col gap-0 px-0 text-xs" aria-label={`Add speech for ${r.name}`}>
                  <span className="text-base leading-none">+2</span><span className="text-[10px] font-medium text-navy-100">Speech</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <aside aria-labelledby="recent-h">
        <div className="card sticky top-24 overflow-hidden">
          <h2 id="recent-h" className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Recent points</h2>
          {recent.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">Points you add will appear here, so you can undo mistakes.</p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
              {recent.map((e) => (
                <li key={e.id} className="flex items-center gap-2 px-4 py-2 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{e.delegation}</span>
                    <span className="block text-xs text-slate-500">{TYPE_LABEL[e.type]} · +{e.points} · {e.at}</span>
                  </span>
                  {!e.linked && (
                    <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => undo(e.id)} aria-label={`Undo ${TYPE_LABEL[e.type]} for ${e.delegation}`}>Undo</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
