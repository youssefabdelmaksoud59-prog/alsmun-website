import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireSecretariat } from "@/lib/auth";
import { CreateUserForm, UserRowControls } from "@/components/secretariat/users";

export const metadata: Metadata = { title: "Chairs & staff" };

export default async function UsersPage() {
  const me = await requireSecretariat();
  const [users, committees] = await Promise.all([
    db.user.findMany({ orderBy: [{ role: "desc" }, { name: "asc" }], include: { committee: true } }),
    db.committee.findMany({ orderBy: [{ sortOrder: "asc" }, { code: "asc" }], select: { id: true, code: true, name: true } }),
  ]);
  const groups = [
    { title: "Secretariat", list: users.filter((u) => u.role === "SECRETARIAT") },
    ...committees.map((c) => ({ title: `${c.code} chairs`, list: users.filter((u) => u.role === "CHAIR" && u.committeeId === c.id) })),
    { title: "Chairs without a committee", list: users.filter((u) => u.role === "CHAIR" && !u.committeeId) },
  ].filter((g) => g.list.length > 0);
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        {groups.map((g) => (
          <section key={g.title} className="card overflow-hidden" aria-label={g.title}>
            <h2 className="border-b border-slate-100 px-4 py-2.5 text-sm font-bold">{g.title}</h2>
            <ul className="divide-y divide-slate-100">
              {g.list.map((u) => (
                <UserRowControls key={u.id} committees={committees}
                  user={{ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, committeeId: u.committeeId, isMe: u.id === me.id }} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="card card-pad h-fit lg:sticky lg:top-24"><CreateUserForm committees={committees} /></div>
    </div>
  );
}
