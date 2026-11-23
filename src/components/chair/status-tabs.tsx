import Link from "next/link";
import clsx from "clsx";

export const STATUS_TABS = [
  { key: "pending", label: "To review" },
  { key: "approved", label: "Approved" },
  { key: "chosen", label: "Chosen for debate" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
] as const;
export type StatusTab = (typeof STATUS_TABS)[number]["key"];

export function parseStatusTab(s: string | undefined): StatusTab {
  return (STATUS_TABS.find((t) => t.key === s)?.key ?? "pending") as StatusTab;
}

export function statusWhere(tab: StatusTab) {
  switch (tab) {
    case "pending": return { status: "PENDING" as const };
    case "approved": return { status: "APPROVED" as const };
    case "chosen": return { chosen: true };
    case "rejected": return { status: "REJECTED" as const };
    default: return {};
  }
}

export function StatusTabs({ base, active, counts }: { base: string; active: StatusTab; counts: Partial<Record<StatusTab, number>> }) {
  return (
    <div className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex w-max gap-1 rounded-xl bg-slate-200/70 p-1">
        {STATUS_TABS.map((t) => (
          <Link key={t.key} href={`${base}?status=${t.key}`} scroll={false}
            className={clsx("whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition", active === t.key ? "bg-white text-navy-950 shadow" : "text-slate-600 hover:text-navy-900")}>
            {t.label}
            {counts[t.key] !== undefined && <span className="ml-1.5 text-xs tabular-nums text-slate-500">{counts[t.key]}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
