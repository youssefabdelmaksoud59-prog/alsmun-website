"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { chairLogin, ownerLogin, secretariatLogin } from "@/app/actions/auth";
import { Alert } from "@/components/ui";

const ACTIONS = { chair: chairLogin, secretariat: secretariatLogin, owner: ownerLogin };
const LABELS = { chair: ["Chair code", "Open chair portal"], secretariat: ["Secretariat code", "Open secretariat"], owner: ["Owner code", "Continue"] };

export function CodeForm({ kind, next }: { kind: "chair" | "secretariat" | "owner"; next: string }) {
  const [state, action, pending] = useActionState(ACTIONS[kind], null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {state && !state.ok && <Alert kind="error">{state.error}</Alert>}
      <div>
        <label htmlFor="code" className="label">{LABELS[kind][0]}</label>
        <input id="code" name="code" type="password" required autoFocus autoComplete="off" autoCapitalize="off" spellCheck={false}
          className="input text-center font-mono text-lg tracking-widest" />
      </div>
      <button type="submit" className={`${kind === "chair" ? "btn-primary" : "btn-gold"} w-full`} disabled={pending}>
        {pending ? "Checking…" : LABELS[kind][1]}
      </button>
    </form>
  );
}

export function CodePage({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="container-page flex justify-center py-12 sm:py-20">
      <div className="card card-pad w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="" width={64} height={64} className="mb-3 h-16 w-16 rounded-full ring-2 ring-gold-400" />
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        {children}
        <p className="mt-6 text-center text-sm"><Link href="/" className="font-semibold text-navy-700 hover:underline">← Back</Link></p>
      </div>
    </div>
  );
}
