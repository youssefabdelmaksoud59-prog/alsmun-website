import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Staff login" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(user.role === "SECRETARIAT" ? "/secretariat" : "/chair");
  if ((await db.user.count()) === 0) redirect("/setup");
  return (
    <div className="container-page flex justify-center py-12 sm:py-20">
      <div className="card card-pad w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="" width={72} height={72} className="mb-3 h-16 w-16 rounded-full ring-2 ring-gold-400" />
          <h1 className="text-xl font-bold">Staff login</h1>
          <p className="mt-1 text-sm text-slate-500">For chairs and the secretariat. Delegates don’t need an account.</p>
        </div>
        <LoginForm next={next ?? ""} />
      </div>
    </div>
  );
}
