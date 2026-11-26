import { requireSecretariat } from "@/lib/auth";
import { StaffBar } from "@/components/staff-bar";
import { SecNav } from "@/components/secretariat/sec-nav";

export const dynamic = "force-dynamic";

export default async function SecretariatLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSecretariat();
  return (
    <>
      <StaffBar user={user} />
      <div className="container-page">
        <div className="pb-3 pt-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-600">Secretariat</p>
          <h1 className="text-2xl font-bold sm:text-3xl">Conference control</h1>
        </div>
        <SecNav isOwner={user.isOwner} />
        <div className="pt-6">{children}</div>
      </div>
    </>
  );
}
