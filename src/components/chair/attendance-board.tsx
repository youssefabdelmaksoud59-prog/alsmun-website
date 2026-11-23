"use client";

import { useActionState, useEffect, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { createAttendanceSession, deleteAttendanceSession, markAllUnmarked, renameAttendanceSession, setAttendance } from "@/app/actions/chair";

type Status = "PRESENT" | "PRESENT_AND_VOTING" | "ABSENT";
type Row = { id: string; name: string; status: Status | null };

const OPTIONS: { value: Status; short: string; label: string; cls: string }[] = [
  { value: "PRESENT", short: "P", label: "Present", cls: "bg-emerald-600 text-white border-emerald-600" },
  { value: "PRESENT_AND_VOTING", short: "PV", label: "Present and voting", cls: "bg-navy-700 text-white border-navy-700" },
  { value: "ABSENT", short: "A", label: "Absent", cls: "bg-red-600 text-white border-red-600" },
];

export function NewSessionForm({ committeeId, base, suggested }: { committeeId: string; base: string; suggested: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createAttendanceSession, null);
  useEffect(() => {
    if (state?.ok && state.data && typeof state.data.id === "string") router.push(`${base}?session=${state.data.id}`);
  }, [state, base, router]);
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <input type="hidden" name="committeeId" value={committeeId} />
      <div className="flex-1">
        <label htmlFor="session-name" className="label">New roll call</label>
        <input id="session-name" name="name" className="input" defaultValue={suggested} maxLength={80} required />
      </div>
      <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Creating…" : "Start roll call"}</button>
      {state && !state.ok && <p className="field-error">{state.error}</p>}
    </form>
  );
}

export function AttendanceBoard({ sessionId, sessionName, rows, base }: { sessionId: string; sessionName: string; rows: Row[]; base: string }) {
  const router = useRouter();
  const [optimistic, apply] = useOptimistic(rows, (state: Row[], op: { id: string | "*"; status: Status | null }) =>
    state.map((r) => (op.id === "*" ? (r.status ? r : { ...r, status: op.status }) : r.id === op.id ? { ...r, status: op.status } : r)),
  );
  const [, start] = useTransition();
  const [error, setError] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(sessionName);

  const set = (id: string, status: Status | null) =>
    start(async () => {
      apply({ id, status });
      const r = await setAttendance(sessionId, id, status);
      setError(r.ok ? "" : r.error);
    });
  const markAll = (status: Status) =>
    start(async () => {
      apply({ id: "*", status });
      const r = await markAllUnmarked(sessionId, status);
      setError(r.ok ? "" : r.error);
    });

  const counts = {
    present: optimistic.filter((r) => r.status === "PRESENT").length,
    voting: optimistic.filter((r) => r.status === "PRESENT_AND_VOTING").length,
    absent: optimistic.filter((r) => r.status === "ABSENT").length,
    unmarked: optimistic.filter((r) => !r.status).length,
  };
  const quorum = counts.present + counts.voting;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {renaming ? (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const r = await renameAttendanceSession(sessionId, name);
                if (r.ok) setRenaming(false);
                else setError(r.error);
              });
            }}
          >
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} aria-label="Roll call name" />
            <button className="btn-primary btn-sm" type="submit">Save</button>
          </form>
        ) : (
          <h2 className="text-lg font-bold">{sessionName}</h2>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-outline btn-sm" onClick={() => markAll("PRESENT")} disabled={counts.unmarked === 0}>Mark unmarked present</button>
          <button type="button" className="btn-outline btn-sm" onClick={() => markAll("ABSENT")} disabled={counts.unmarked === 0}>Mark unmarked absent</button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setRenaming((r) => !r)}>{renaming ? "Cancel" : "Rename"}</button>
          <button
            type="button"
            className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
            onClick={() => {
              if (!window.confirm(`Delete “${sessionName}” and its attendance records?`)) return;
              start(async () => {
                const r = await deleteAttendanceSession(sessionId);
                if (r.ok) router.push(base);
                else setError(r.error);
              });
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-center text-sm sm:grid-cols-5">
        <Stat label="Present" value={counts.present} />
        <Stat label="Present & voting" value={counts.voting} />
        <Stat label="Absent" value={counts.absent} />
        <Stat label="Not marked" value={counts.unmarked} />
        <Stat label="Simple majority" value={quorum ? Math.floor(quorum / 2) + 1 : 0} hint={`of ${quorum} present`} />
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}

      <ul className="grid gap-2 md:grid-cols-2">
        {optimistic.map((r) => (
          <li key={r.id} className="card flex items-center justify-between gap-3 px-4 py-2.5" data-testid="attendance-row">
            <span className="min-w-0 truncate font-medium">{r.name}</span>
            <div className="flex shrink-0 gap-1" role="radiogroup" aria-label={`Attendance for ${r.name}`}>
              {OPTIONS.map((o) => {
                const on = r.status === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    title={o.label}
                    aria-label={`${o.label}: ${r.name}`}
                    onClick={() => set(r.id, on ? null : o.value)}
                    className={clsx("h-10 min-w-11 rounded-lg border px-2 text-sm font-bold transition", on ? o.cls : "border-slate-300 bg-white text-slate-500 hover:border-slate-400")}
                  >
                    {o.short}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="card px-3 py-2">
      <div className="text-xl font-bold tabular-nums text-navy-950">{value}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      {hint && <div className="text-[11px] text-slate-400">{hint}</div>}
    </div>
  );
}

export function SessionPicker({ sessions, active, base }: { sessions: { id: string; name: string }[]; active?: string; base: string }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex w-max gap-2">
        {sessions.map((s) => (
          <Link key={s.id} href={`${base}?session=${s.id}`} scroll={false}
            className={clsx("whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold", s.id === active ? "border-navy-700 bg-navy-700 text-white" : "border-slate-300 bg-white text-navy-900 hover:border-navy-400")}>
            {s.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
