import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { ChairCodeRow, OwnerCodeForm, SecretariatCodeForm } from "@/components/secretariat/codes";

export const metadata: Metadata = { title: "Access codes" };

export const dynamic = "force-dynamic";

export default async function CodesPage() {
  await requireOwner();
  const committees = await db.committee.findMany({
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    select: { id: true, code: true, name: true, chairCode: true },
  });
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="card overflow-hidden" aria-labelledby="cc-h">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 id="cc-h" className="font-bold">Chair codes</h2>
          <p className="text-xs text-slate-500">Each committee has its own code. Its chairs type it on the Chair page to open their portal. Changing a code signs out anyone using the old one.</p>
        </div>
        <ul className="divide-y divide-slate-100">
          {committees.map((c) => <ChairCodeRow key={c.id} committee={c} />)}
        </ul>
      </section>
      <div className="space-y-6">
        <div className="card card-pad h-fit"><SecretariatCodeForm /></div>
        <div className="card card-pad h-fit"><OwnerCodeForm /></div>
      </div>
    </div>
  );
}
