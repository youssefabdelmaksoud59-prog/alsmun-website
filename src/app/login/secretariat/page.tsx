import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, secretariatCodeHash } from "@/lib/auth";
import { CodeForm, CodePage } from "@/components/auth/code-form";

export const metadata: Metadata = { title: "Secretariat" };
export const dynamic = "force-dynamic";

export default async function SecretariatLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user?.role === "SECRETARIAT") redirect("/secretariat");
  if (!(await secretariatCodeHash())) redirect("/setup");
  return (
    <CodePage title="Secretariat" description="Enter the secretariat code to see every committee and any problems that need attention.">
      <CodeForm kind="secretariat" next={next ?? ""} />
    </CodePage>
  );
}
