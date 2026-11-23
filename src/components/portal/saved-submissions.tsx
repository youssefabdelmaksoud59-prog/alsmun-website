"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadSubmissions, type SavedSubmission } from "./storage";

export function SavedSubmissions() {
  const [list, setList] = useState<SavedSubmission[]>([]);
  useEffect(() => setList(loadSubmissions()), []);
  if (list.length === 0) return null;
  return (
    <section className="mt-8" aria-labelledby="saved-h">
      <h2 id="saved-h" className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Submitted from this device</h2>
      <ul className="card divide-y divide-slate-100">
        {list.map((s) => (
          <li key={s.code}>
            <Link href={`/track?code=${encodeURIComponent(s.code)}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
              <span>
                <span className="block text-sm font-semibold text-navy-950">{s.kind} {s.reference}</span>
                <span className="block font-mono text-xs text-slate-500">{s.code}</span>
              </span>
              <span className="text-xs font-semibold text-navy-700">Check →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
