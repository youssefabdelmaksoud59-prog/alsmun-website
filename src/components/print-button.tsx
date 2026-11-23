"use client";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button type="button" className="btn-outline btn-sm" onClick={() => window.print()}>
      {label}
    </button>
  );
}
