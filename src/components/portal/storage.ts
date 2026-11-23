"use client";

const KEY_DELEGATION = "alsmun:delegation";
const KEY_SUBMISSIONS = "alsmun:submissions";

export type SavedSubmission = { code: string; reference: string; kind: "Resolution" | "Amendment"; at: string };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: nothing to do */
  }
}

export function loadDelegation(): { committeeId?: string; delegationId?: string; delegationName?: string } {
  return read(KEY_DELEGATION, {});
}
export function saveDelegation(v: { committeeId: string; delegationId: string; delegationName: string }) {
  write(KEY_DELEGATION, v);
}
export function loadSubmissions(): SavedSubmission[] {
  return read<SavedSubmission[]>(KEY_SUBMISSIONS, []);
}
export function addSubmission(s: SavedSubmission) {
  const list = loadSubmissions().filter((x) => x.code !== s.code);
  write(KEY_SUBMISSIONS, [s, ...list].slice(0, 50));
}
