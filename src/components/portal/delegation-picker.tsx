"use client";

import { useEffect, useState } from "react";
import type { PortalCommittee } from "./types";
import { loadDelegation } from "./storage";

/** Remembers the delegation picked last time in this committee, so repeat submissions are quick. */
export function useDelegationChoice(committee: PortalCommittee) {
  const [delegationId, setDelegationId] = useState("");
  const [delegationName, setDelegationName] = useState("");

  useEffect(() => {
    const saved = loadDelegation();
    if (saved.committeeId !== committee.id) return;
    if (saved.delegationId && committee.delegations.some((d) => d.id === saved.delegationId)) setDelegationId(saved.delegationId);
    if (saved.delegationName) setDelegationName(saved.delegationName);
  }, [committee]);

  return { committeeId: committee.id, delegationId, setDelegationId, delegationName, setDelegationName };
}

export function DelegationPicker({
  committee,
  choice,
  errors,
}: {
  committee: PortalCommittee;
  choice: ReturnType<typeof useDelegationChoice>;
  errors?: Record<string, string>;
}) {
  const hasRoster = committee.delegations.length > 0;
  return (
    <div>
      <input type="hidden" name="committeeId" value={committee.id} />
      <label htmlFor={hasRoster ? "delegationId" : "delegationName"} className="label">Your delegation</label>
      {hasRoster ? (
        <>
          <select
            id="delegationId"
            name="delegationId"
            className="input"
            required
            value={choice.delegationId}
            onChange={(e) => choice.setDelegationId(e.target.value)}
            aria-invalid={!!errors?.delegationId}
          >
            <option value="">Choose your delegation…</option>
            {committee.delegations.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <p className="hint">Not listed? Ask your chair to add your delegation.</p>
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
      {errors?.committeeId && <p className="field-error">{errors.committeeId}</p>}
    </div>
  );
}
