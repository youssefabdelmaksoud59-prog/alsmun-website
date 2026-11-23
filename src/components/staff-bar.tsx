import Link from "next/link";
import { logout } from "@/app/actions/auth";
import type { CurrentUser } from "@/lib/auth";

export function StaffBar({ user, children }: { user: CurrentUser; children?: React.ReactNode }) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="container-page flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
        <div className="flex min-w-0 items-center gap-2 text-slate-600">
          <span className={user.role === "SECRETARIAT" ? "badge-chosen" : "badge-blue"}>{user.role === "SECRETARIAT" ? "Secretariat" : "Chair"}</span>
          <span className="truncate">Signed in as <strong className="text-navy-950">{user.name}</strong></span>
        </div>
        <div className="flex items-center gap-1">
          {children}
          {user.role === "SECRETARIAT" && <Link href="/secretariat" className="btn-ghost btn-sm">Secretariat</Link>}
          <Link href="/account" className="btn-ghost btn-sm">Account</Link>
          <form action={logout}><button type="submit" className="btn-ghost btn-sm">Sign out</button></form>
        </div>
      </div>
    </div>
  );
}
