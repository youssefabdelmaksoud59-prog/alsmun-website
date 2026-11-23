import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ResolutionForm } from "@/components/portal/resolution-form";
import { ResolutionGuide } from "@/components/thimun-guide";
import { loadPortalCommittee } from "@/lib/portal";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Submit a resolution" };
export const dynamic = "force-dynamic";

export default async function SubmitResolutionPage({ params }: { params: Promise<{ code: string }> }) {
  const committee = await loadPortalCommittee((await params).code);
  if (!committee) notFound();
  return (
    <div className="container-page">
      <PageHeader eyebrow={committee.code} title="Submit a resolution" description="Write your draft clause by clause. The guide shows the THIMUN format your chairs expect." />
      <details className="card mb-6 lg:hidden">
        <summary className="cursor-pointer px-5 py-4 font-semibold text-navy-900">How to write a THIMUN resolution</summary>
        <div className="border-t border-slate-100 px-5 py-4"><ResolutionGuide /></div>
      </details>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <ResolutionForm committee={committee} />
        <aside className="hidden lg:block" aria-label="THIMUN resolution guide">
          <div className="card card-pad sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto">
            <ResolutionGuide />
          </div>
        </aside>
      </div>
    </div>
  );
}
