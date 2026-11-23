"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "alsmun:committee";

export function RememberCommittee({ code }: { code: string }) {
  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, code);
    } catch {
      /* storage unavailable */
    }
  }, [code]);
  return null;
}

/** On the committee picker, offer a one-tap way back to the committee used last on this device. */
export function ContinueCommittee({ committees }: { committees: { code: string; name: string }[] }) {
  const [last, setLast] = useState<{ code: string; name: string } | null>(null);
  useEffect(() => {
    try {
      const code = window.localStorage.getItem(KEY);
      setLast(committees.find((c) => c.code === code) ?? null);
    } catch {
      /* storage unavailable */
    }
  }, [committees]);
  if (!last) return null;
  return (
    <Link href={`/delegate/${encodeURIComponent(last.code)}`} className="mb-6 flex items-center justify-between gap-3 rounded-2xl border-2 border-gold-400 bg-gold-50 px-5 py-4 transition hover:bg-gold-100">
      <span>
        <span className="block text-xs font-bold uppercase tracking-wide text-gold-700">Continue where you left off</span>
        <span className="block font-semibold text-navy-950">{last.code} · {last.name}</span>
      </span>
      <span aria-hidden className="text-xl text-navy-800">→</span>
    </Link>
  );
}
