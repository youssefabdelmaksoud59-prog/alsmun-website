import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CodeForm, CodePage } from "@/components/auth/code-form";

export const metadata: Metadata = { title: "Chair portal" };
export const dynamic = "force-dynamic";

export default async function ChairLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user?.role === "CHAIR" && user.committee) redirect(`/chair/${encodeURIComponent(user.committee.code)}`);
  if (user?.role === "SECRETARIAT") redirect("/chair");
  return (
    <CodePage title="Chair portal" description="Enter the chair code for your committee. The secretariat gives each committee its own code.">
      <CodeForm kind="chair" next={next ?? ""} />
    </CodePage>
  );
}
