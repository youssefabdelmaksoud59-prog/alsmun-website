"use client";

import { useEffect, useState } from "react";
import type { PortalCommittee } from "./types";
import { loadDelegation } from "./storage";

export function useDelegationChoice(committees: PortalCommittee[], initialCommittee?: string) {
  const [committeeId, setCommitteeId] = useState(() => committees.find((c) => c.code === initialCommittee)?.id ?? "");
  const [delegationId, setDelegationId] = useState("");
  const [delegationName, setDelegationName] = useState("");

  useEffect(() => {
    const saved = loadDelegation();
    if (initialCommittee && committees.some((c) => c.code === initialCommittee)) {
      const c = committees.find((x) => x.code === initialCommittee)!;
      if (saved.committeeId === c.id) {
        if (saved.delegationId && c.delegations.some((d) => d.id === saved.delegationId)) setDelegationId(saved.delegationId);
        if (saved.delegationName) setDelegationName(saved.delegationName);
      }
      return;
    }
    const c = committees.find((x) => x.id === saved.committeeId);
    if (!c) return;
    setCommitteeId(c.id);
    if (saved.delegationId && c.delegations.some((d) => d.id === saved.delegationId)) setDelegationId(saved.delegationId);
    if (saved.delegationName) setDelegationName(saved.delegationName);
  }, [committees, initialCommittee]);

  return { committeeId, setCommitteeId, delegationId, setDelegationId, delegationName, setDelegationName };
}

export function DelegationPicker({
  committees,
  choice,
  errors,
}: {
  committees: PortalCommittee[];
  choice: ReturnType<typeof useDelegationChoice>;
  errors?: Record<string, string>;
}) {
  const committee = committees.find((c) => c.id === choice.committeeId);
  const hasRoster = (committee?.delegations.length ?? 0) > 0;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="committeeId" className="label">Committee</label>
        <select
          id="committeeId"
          name="committeeId"
          className="input"
          required
          value={choice.committeeId}
          onChange={(e) => {
            choice.setCommitteeId(e.target.value);
            choice.setDelegationId("");
          }}
          aria-invalid={!!errors?.committeeId}
        >
          <option value="">Choose your committee…</option>
          {committees.map((c) => (
            <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
          ))}
        </select>
        {errors?.committeeId && <p className="field-error">{errors.committeeId}</p>}
      </div>
      <div>
        <label htmlFor={hasRoster || !committee ? "delegationId" : "delegationName"} className="label">Your delegation</label>
        {hasRoster || !committee ? (
          <>
            <select
              id="delegationId"
              name="delegationId"
              className="input"
              required
              disabled={!committee}
              value={choice.delegationId}
              onChange={(e) => choice.setDelegationId(e.target.value)}
              aria-invalid={!!errors?.delegationId}
            >
              <option value="">{committee ? "Choose your delegation…" : "Choose a committee first"}</option>
              {committee?.delegations.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {committee && <p className="hint">Not listed? Ask your chair to add your delegation.</p>}
          </>
        ) : (
          <>
            <input
              id="delegationName"
              name="delegationName"
              className="input"
              required
              maxLength={80}
              placeholder="e.g. Republic of Kenya"
              value={choice.delegationName}
              onChange={(e) => choice.setDelegationName(e.target.value)}
              aria-invalid={!!errors?.delegationId}
            />
            <p className="hint">Type the country or organisation you represent.</p>
          </>
        )}
        {errors?.delegationId && <p className="field-error">{errors.delegationId}</p>}
      </div>
    </div>
  );
}
