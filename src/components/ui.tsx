import Link from "next/link";
import clsx from "clsx";
import type { ReviewStatus } from "@prisma/client";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 pb-6 pt-8 sm:flex-row sm:items-end sm:justify-between sm:pt-10">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-gold-600">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <div className="mt-2 max-w-2xl text-[15px] text-slate-600">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status, chosen }: { status: ReviewStatus; chosen?: boolean }) {
  if (chosen) return <span className="badge-chosen">★ Chosen for debate</span>;
  if (status === "APPROVED") return <span className="badge-approved">Approved</span>;
  if (status === "REJECTED") return <span className="badge-rejected">Rejected</span>;
  return <span className="badge-pending">Awaiting review</span>;
}

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="card card-pad flex flex-col items-center py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 text-navy-600" aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16v14H4z" /><path d="M8 9h8M8 13h5" /></svg>
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      {children && <div className="mt-1 max-w-md text-sm text-slate-500">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function CommitteeTabs({
  committees,
  active,
  basePath,
  allLabel,
  param = "committee",
}: {
  committees: { code: string }[];
  active?: string;
  basePath: string;
  allLabel?: string;
  param?: string;
}) {
  const items = allLabel ? [{ code: "", label: allLabel }, ...committees.map((c) => ({ code: c.code, label: c.code }))] : committees.map((c) => ({ code: c.code, label: c.code }));
  return (
    <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap" role="tablist" aria-label="Committee">
        {items.map((c) => {
          const isActive = (active ?? "") === c.code;
          return (
            <Link
              key={c.code || "all"}
              role="tab"
              aria-selected={isActive}
              href={c.code ? `${basePath}?${param}=${encodeURIComponent(c.code)}` : basePath}
              className={clsx(
                "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
                isActive ? "border-navy-700 bg-navy-700 text-white" : "border-slate-300 bg-white text-navy-900 hover:border-navy-400",
              )}
              scroll={false}
            >
              {c.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Alert({ kind = "info", children }: { kind?: "info" | "success" | "error" | "warning"; children: React.ReactNode }) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={clsx(
        "rounded-xl border px-4 py-3 text-sm",
        kind === "info" && "border-navy-200 bg-navy-50 text-navy-900",
        kind === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
        kind === "error" && "border-red-200 bg-red-50 text-red-800",
        kind === "warning" && "border-amber-200 bg-amber-50 text-amber-900",
      )}
    >
      {children}
    </div>
  );
}
