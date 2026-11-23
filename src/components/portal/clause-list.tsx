"use client";

import { useId } from "react";

export function ClauseList({
  kind,
  clauses,
  onChange,
  numbered,
  placeholder,
}: {
  kind: string;
  clauses: string[];
  onChange: (next: string[]) => void;
  numbered?: boolean;
  placeholder: string;
}) {
  const id = useId();
  const update = (i: number, v: string) => onChange(clauses.map((c, j) => (j === i ? v : c)));
  const remove = (i: number) => onChange(clauses.length === 1 ? [""] : clauses.filter((_, j) => j !== i));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= clauses.length) return;
    const next = [...clauses];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {clauses.map((c, i) => (
        <div key={i} className="group relative rounded-xl border border-slate-200 bg-slate-50/50 p-3 focus-within:border-sky-300 focus-within:bg-white">
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor={`${id}-${i}`} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {numbered ? `Operative clause ${i + 1}` : `Preambulatory clause ${i + 1}`}
            </label>
            <div className="flex items-center gap-0.5">
              <IconBtn label={`Move ${kind} clause ${i + 1} up`} onClick={() => move(i, -1)} disabled={i === 0} d="M12 19V5M5 12l7-7 7 7" />
              <IconBtn label={`Move ${kind} clause ${i + 1} down`} onClick={() => move(i, 1)} disabled={i === clauses.length - 1} d="M12 5v14M19 12l-7 7-7-7" />
              <IconBtn label={`Remove ${kind} clause ${i + 1}`} onClick={() => remove(i)} d="M6 6l12 12M18 6L6 18" />
            </div>
          </div>
          <textarea
            id={`${id}-${i}`}
            className="input min-h-[76px] resize-y font-serif text-[15px]"
            value={c}
            placeholder={placeholder}
            onChange={(e) => update(i, e.target.value)}
            rows={numbered ? 3 : 2}
          />
        </div>
      ))}
      <button type="button" className="btn-outline btn-sm" onClick={() => onChange([...clauses, ""])}>
        + Add {kind} clause
      </button>
    </div>
  );
}

function IconBtn({ label, onClick, disabled, d }: { label: string; onClick: () => void; disabled?: boolean; d: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-navy-900 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
    </button>
  );
}
