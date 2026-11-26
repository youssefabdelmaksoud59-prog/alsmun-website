import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, ownerCodeHash } from "@/lib/auth";
import { CodeForm, CodePage } from "@/components/auth/code-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OwnerLoginPage() {
  const user = await getCurrentUser();
  if (user?.isOwner) redirect("/secretariat/codes");
  if (!(await ownerCodeHash())) redirect("/setup");
  return (
    <CodePage title="Owner" description="Enter the owner code to manage access codes.">
      <CodeForm kind="owner" next="" />
    </CodePage>
  );
}
