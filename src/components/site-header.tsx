"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";

const ROLE_NAV = [
  { href: "/delegate", label: "Delegate" },
  { href: "/login/chair", label: "Chair" },
  { href: "/login/secretariat", label: "Secretariat" },
  { href: "/resources", label: "Resources" },
];

/** Inside a committee's delegate portal, the menu switches to that committee's pages. */
function navFor(pathname: string) {
  const m = /^\/delegate\/([^/]+)/.exec(pathname);
  if (!m) return ROLE_NAV;
  const base = `/delegate/${m[1]}`;
  return [
    { href: `${base}/amendments`, label: "Amendments" },
    { href: `${base}/resolutions`, label: "Resolutions" },
    { href: `${base}/schedule`, label: "Schedule" },
    { href: `${base}/reports`, label: "Chair reports" },
    { href: "/resources", label: "Resources" },
  ];
}

export function SiteHeader({ name, user }: { name: string; user: { name: string; role: "SECRETARIAT" | "CHAIR" } | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const NAV = navFor(pathname);
  const staffHref = user ? (user.role === "SECRETARIAT" ? "/secretariat" : "/chair") : null;
  const staffLabel = user ? (user.role === "SECRETARIAT" ? "Secretariat" : "Chair portal") : null;

  return (
    <header className="sticky top-0 z-40 border-b border-navy-900 bg-navy-950 text-white">
      <div className="h-1 bg-gradient-to-r from-gold-500 via-gold-300 to-gold-500" />
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3" aria-label={`${name} home`}>
          <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-full ring-2 ring-gold-400/70" priority />
          <span className="font-display text-xl font-bold tracking-wider text-gold-300">{name}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={clsx(
                "rounded-md px-3 py-2 text-sm font-medium transition hover:bg-white/10",
                pathname.startsWith(n.href) ? "text-gold-300" : "text-slate-200",
              )}
            >
              {n.label}
            </Link>
          ))}
          {staffHref && (
            <Link href={staffHref} className="btn-gold btn-sm ml-2">
              {staffLabel}
            </Link>
          )}
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-100 hover:bg-white/10 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-white/10 lg:hidden" aria-label="Main">
          <div className="container-page flex flex-col py-2">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={clsx(
                  "rounded-md px-3 py-3 text-base font-medium hover:bg-white/10",
                  pathname.startsWith(n.href) ? "text-gold-300" : "text-slate-100",
                )}
              >
                {n.label}
              </Link>
            ))}
            {staffHref && (
              <Link href={staffHref} className="btn-gold mb-2 mt-2">
                {staffLabel}
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
