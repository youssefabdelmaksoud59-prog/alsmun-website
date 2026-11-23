import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { PasswordForm } from "./password-form";
import { logout } from "@/app/actions/auth";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div className="container-page max-w-xl">
      <PageHeader eyebrow={user.role === "SECRETARIAT" ? "Secretariat" : `Chair · ${user.committee?.code ?? "No committee"}`} title="My account" description={<>{user.name} · {user.email}</>} />
      <div className="card card-pad">
        <h2 className="mb-4 text-base font-bold">Change password</h2>
        <PasswordForm />
      </div>
      <form action={logout} className="mt-6">
        <button className="btn-outline" type="submit">Sign out</button>
      </form>
    </div>
  );
}
