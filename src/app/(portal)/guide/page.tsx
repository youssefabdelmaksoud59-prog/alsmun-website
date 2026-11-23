import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { AmendmentGuide, ResolutionGuide } from "@/components/thimun-guide";

export const metadata: Metadata = { title: "THIMUN format guide" };

export default function GuidePage() {
  return (
    <div className="container-page">
      <PageHeader eyebrow="Delegate" title="THIMUN format guide" description="How to write resolutions and amendments the way your chairs expect them." />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card card-pad" aria-labelledby="g-res">
          <h2 id="g-res" className="mb-4 text-lg font-bold">Resolutions</h2>
          <ResolutionGuide />
          <Link href="/delegate" className="btn-gold mt-5">Submit a resolution</Link>
        </section>
        <section className="card card-pad" aria-labelledby="g-am">
          <h2 id="g-am" className="mb-4 text-lg font-bold">Amendments</h2>
          <AmendmentGuide />
          <Link href="/delegate" className="btn-gold mt-5">Submit an amendment</Link>
        </section>
      </div>
    </div>
  );
}
