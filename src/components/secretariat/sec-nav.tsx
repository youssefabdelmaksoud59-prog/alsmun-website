"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const ITEMS = [
  { href: "/secretariat", label: "Overview", exact: true },
  { href: "/secretariat/issues", label: "Problems" },
  { href: "/secretariat/codes", label: "Access codes" },
  { href: "/secretariat/committees", label: "Committees" },
  { href: "/secretariat/broadcast", label: "Announcements & crisis" },
  { href: "/secretariat/schedule", label: "Schedule" },
  { href: "/secretariat/settings", label: "Conference settings" },
  { href: "/chair", label: "Chair tools", exact: true },
];

export function SecNav() {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Secretariat">
      <ul className="flex w-max gap-1 border-b border-slate-200">
        {ITEMS.map((it) => {
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link href={it.href} aria-current={active ? "page" : undefined}
                className={clsx("-mb-px inline-block whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold", active ? "border-gold-500 text-navy-950" : "border-transparent text-slate-500 hover:text-navy-800")}>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
