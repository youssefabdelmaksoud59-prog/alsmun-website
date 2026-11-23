import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmptyState, PageHeader } from "@/components/ui";
import { StaffBar } from "@/components/staff-bar";

export const metadata: Metadata = { title: "Chair panel" };
export const dynamic = "force-dynamic";

export default async function ChairHome() {
  const user = await requireUser();
  if (user.role === "CHAIR") {
    if (user.committee) redirect(`/chair/${encodeURIComponent(user.committee.code)}`);
    return (
      <>
        <StaffBar user={user} />
        <div className="container-page max-w-xl py-10">
          <EmptyState title="You aren’t assigned to a committee yet">Ask the secretariat to assign you to your committee, then refresh this page.</EmptyState>
        </div>
      </>
    );
  }
  const committees = await db.committee.findMany({
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    include: {
      _count: {
        select: {
          delegations: true,
          resolutions: { where: { status: "PENDING" } },
          amendments: { where: { status: "PENDING" } },
        },
      },
    },
  });
  return (
    <>
      <StaffBar user={user} />
      <div className="container-page">
        <PageHeader eyebrow="Secretariat" title="Open a committee" description="As secretariat you can use the chair tools of any committee." />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {committees.map((c) => (
            <li key={c.id}>
              <Link href={`/chair/${encodeURIComponent(c.code)}`} className="card flex items-center justify-between gap-3 p-4 hover:border-navy-300">
                <span>
                  <span className="block font-bold text-navy-950">{c.code}</span>
                  <span className="block text-xs text-slate-500">{c.name} · {c._count.delegations} delegations</span>
                </span>
                {c._count.resolutions + c._count.amendments > 0 && (
                  <span className="badge-pending">{c._count.resolutions + c._count.amendments} to review</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
