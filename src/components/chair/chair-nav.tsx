"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export function ChairNav({ code, pending }: { code: string; pending: { resolutions: number; amendments: number; issues: number } }) {
  const pathname = usePathname();
  const base = `/chair/${encodeURIComponent(code)}`;
  const items = [
    { href: base, label: "Overview", exact: true },
    { href: `${base}/amendments`, label: "Amendments", count: pending.amendments },
    { href: `${base}/resolutions`, label: "Resolutions", count: pending.resolutions },
    { href: `${base}/points`, label: "Points" },
    { href: `${base}/attendance`, label: "Attendance" },
    { href: `${base}/scores`, label: "Score sheet" },
    { href: `${base}/reports`, label: "Reports" },
    { href: `${base}/crisis`, label: "Crisis" },
    { href: `${base}/issues`, label: "Strikes & problems", count: pending.issues },
    { href: `${base}/setup`, label: "Delegations & topics" },
  ];
  return (
    <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Chair tools">
      <ul className="flex w-max gap-1 border-b border-slate-200">
        {items.map((it) => {
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition",
                  active ? "border-gold-500 text-navy-950" : "border-transparent text-slate-500 hover:text-navy-800",
                )}
              >
                {it.label}
                {!!it.count && (
                  <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white" aria-label={`${it.count} awaiting review`}>
                    {it.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
