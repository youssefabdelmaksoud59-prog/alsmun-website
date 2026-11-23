import Link from "next/link";
import { activeAnnouncements, publishedCrisis } from "@/lib/broadcast";
import { formatDateTime } from "@/lib/time";

/** Secretariat announcements, shown on every committee page (delegate and chair). */
export async function AnnouncementBanners() {
  const items = await activeAnnouncements();
  if (items.length === 0) return null;
  return (
    <div className="border-b border-gold-300 bg-gold-50" role="region" aria-label="Announcements from the secretariat">
      <ul className="container-page divide-y divide-gold-200">
        {items.map((a) => (
          <li key={a.id} className="flex items-start gap-3 py-2.5 text-sm text-navy-950" data-testid="announcement">
            <span className="mt-0.5 inline-flex h-5 shrink-0 items-center rounded bg-gold-400 px-1.5 text-[11px] font-bold uppercase tracking-wide">Notice</span>
            <span className="min-w-0">
              <strong className="font-semibold">{a.title}</strong>
              {a.body && <span className="block whitespace-pre-line text-slate-700">{a.body}</span>}
              <span className="block text-xs text-slate-500">Secretariat · {formatDateTime(a.createdAt)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The latest published crisis update for a committee, with a link to the full feed. */
export async function LatestCrisis({ committeeId, href }: { committeeId: string; href: string }) {
  const [latest] = await publishedCrisis(committeeId, 1);
  if (!latest) return null;
  return (
    <div className="border-b border-red-900 bg-red-700 text-white" role="region" aria-label="Crisis update">
      <div className="container-page flex flex-col gap-1 py-2.5 text-sm sm:flex-row sm:items-center sm:gap-3">
        <span className="inline-flex h-5 w-fit shrink-0 items-center rounded bg-white px-1.5 text-[11px] font-bold uppercase tracking-wide text-red-700">Crisis</span>
        <span className="min-w-0 flex-1 truncate"><strong>{latest.title}</strong> <span className="text-red-100">· {formatDateTime(latest.publishAt)}</span></span>
        <Link href={href} className="shrink-0 font-semibold underline underline-offset-2">All crisis updates</Link>
      </div>
    </div>
  );
}
