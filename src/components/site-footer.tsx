import Link from "next/link";

export function SiteFooter({ name }: { name: string }) {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-page flex flex-col gap-3 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-display font-semibold text-navy-900">{name}</span> · Model United Nations
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
          <Link href="/track" className="hover:text-navy-800">Track a submission</Link>
          <Link href="/resources" className="hover:text-navy-800">Resources</Link>
          <Link href="/delegate" className="hover:text-navy-800">Delegate portal</Link>
        </nav>
      </div>
    </footer>
  );
}
