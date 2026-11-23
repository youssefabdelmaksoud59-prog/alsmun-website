export function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: React.ReactNode;
  name: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      {children}
      {hint && !error && <p className="hint">{hint}</p>}
      {error && <p className="field-error" id={`${name}-error`}>{error}</p>}
    </div>
  );
}

export function SubmitButton({ pending, children, className = "btn-primary", pendingText }: { pending: boolean; children: React.ReactNode; className?: string; pendingText?: string }) {
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText ?? "Saving…" : children}
    </button>
  );
}
