import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SetupForm } from "./setup-form";

export const metadata: Metadata = { title: "First-time setup" };
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if ((await db.user.count()) > 0) redirect("/login");
  return (
    <div className="container-page flex justify-center py-12 sm:py-20">
      <div className="card card-pad w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-600">First-time setup</p>
        <h1 className="mt-1 text-xl font-bold">Create the secretariat account</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">This page only works once, before any account exists. You can add chairs and more secretariat members afterwards.</p>
        <SetupForm />
      </div>
    </div>
  );
}
