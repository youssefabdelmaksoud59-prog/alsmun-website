import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="font-display text-6xl font-bold text-gold-500">404</p>
      <h1 className="mt-3 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-600">The page you’re looking for doesn’t exist or has moved.</p>
      <Link href="/" className="btn-primary mt-6">Back to the portal</Link>
    </div>
  );
}
