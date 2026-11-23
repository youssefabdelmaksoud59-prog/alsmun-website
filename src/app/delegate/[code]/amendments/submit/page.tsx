import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { AmendmentForm } from "@/components/portal/amendment-form";
import { AmendmentGuide } from "@/components/thimun-guide";
import { loadPortalCommittee } from "@/lib/portal";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Submit an amendment" };
export const dynamic = "force-dynamic";

export default async function SubmitAmendmentPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ resolution?: string }> }) {
  const [committee, { resolution }] = await Promise.all([params.then((p) => loadPortalCommittee(p.code)), searchParams]);
  if (!committee) notFound();
  return (
    <div className="container-page">
      <PageHeader eyebrow={committee.code} title="Submit an amendment" description="Propose a change to an operative clause. Your chairs review it before it is shown to the committee." />
      <details className="card mb-6 lg:hidden">
        <summary className="cursor-pointer px-5 py-4 font-semibold text-navy-900">How to write a THIMUN amendment</summary>
        <div className="border-t border-slate-100 px-5 py-4"><AmendmentGuide /></div>
      </details>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <AmendmentForm committee={committee} initialResolution={resolution} />
        <aside className="hidden lg:block" aria-label="THIMUN amendment guide">
          <div className="card card-pad sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto">
            <AmendmentGuide />
          </div>
        </aside>
      </div>
    </div>
  );
}
