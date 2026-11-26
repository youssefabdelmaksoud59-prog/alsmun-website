import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ownerCodeHash, secretariatCodeHash } from "@/lib/auth";
import { SetupForm } from "./setup-form";

export const metadata: Metadata = { title: "First-time setup" };
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (await ownerCodeHash()) redirect("/login/secretariat");
  const ownerOnly = !!(await secretariatCodeHash());
  return (
    <div className="container-page flex justify-center py-12 sm:py-20">
      <div className="card card-pad w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-600">First-time setup</p>
        <h1 className="mt-1 text-xl font-bold">{ownerOnly ? "Choose the owner code" : "Choose your codes"}</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">
          This page only works once. The <strong>owner code</strong> is for you alone: it is the only way to change the secretariat code and the chair codes.
          {ownerOnly
            ? " A secretariat code already exists, so sign in with it first, then set the owner code here."
            : " The secretariat code is the one you give your secretariat team."}
        </p>
        <SetupForm ownerOnly={ownerOnly} />
      </div>
    </div>
  );
}
