"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-slate-600">Please try again. If it keeps happening, tell the secretariat.</p>
      <div className="mt-6 flex gap-3">
        <button type="button" className="btn-primary" onClick={() => reset()}>Try again</button>
        <Link href="/" className="btn-outline">Home</Link>
      </div>
    </div>
  );
}
