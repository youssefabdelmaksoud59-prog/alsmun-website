"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  MIN_CODE_LENGTH,
  OWNER_CODE_KEY,
  SECRETARIAT_CODE_KEY,
  assertOwner,
  checkOwnerCode,
  checkSecretariatCode,
  codeVersion,
  endSession,
  hashCode,
  getCurrentUser,
  normaliseAccessCode,
  ownerCodeHash,
  secretariatCodeHash,
  startChairSession,
  startOwnerSession,
  startSecretariatSession,
} from "@/lib/auth";
import { clientIp, isLimited, recordHit } from "@/lib/rate-limit";
import { str, type FormState } from "@/lib/form";

const WINDOW = 15 * 60 * 1000;
const TOO_MANY = "Too many wrong codes from this device. Please wait 15 minutes and try again.";

function isLocalPath(p: string) {
  return p.startsWith("/") && !p.startsWith("//");
}

export async function chairLogin(_prev: FormState, fd: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (isLimited(`code:${ip}`, 12)) return { ok: false, error: TOO_MANY };
  const code = normaliseAccessCode(str(fd, "code"));
  if (!code) return { ok: false, error: "Enter your chair code." };
  const committee = await db.committee.findFirst({ where: { chairCode: { equals: code, mode: "insensitive" } } });
  if (!committee) {
    recordHit(`code:${ip}`, WINDOW);
    return { ok: false, error: "That chair code isn’t right. Check it with the secretariat." };
  }
  await startChairSession(committee);
  const home = `/chair/${encodeURIComponent(committee.code)}`;
  const next = str(fd, "next");
  redirect(isLocalPath(next) && next.startsWith(home) ? next : home);
}

export async function secretariatLogin(_prev: FormState, fd: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (isLimited(`code:${ip}`, 12)) return { ok: false, error: TOO_MANY };
  const code = str(fd, "code");
  if (!code.trim()) return { ok: false, error: "Enter the secretariat code." };
  if (!(await secretariatCodeHash())) redirect("/setup");
  const { ok, version } = await checkSecretariatCode(code);
  if (!ok) {
    recordHit(`code:${ip}`, WINDOW);
    return { ok: false, error: "That secretariat code isn’t right." };
  }
  await startSecretariatSession(version);
  const next = str(fd, "next");
  redirect(isLocalPath(next) && (next.startsWith("/secretariat") || next.startsWith("/chair")) ? next : "/secretariat");
}

export async function ownerLogin(_prev: FormState, fd: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (isLimited(`code:${ip}`, 12)) return { ok: false, error: TOO_MANY };
  const code = str(fd, "code");
  if (!code.trim()) return { ok: false, error: "Enter the owner code." };
  if (!(await ownerCodeHash())) redirect("/setup");
  const { ok, version } = await checkOwnerCode(code);
  if (!ok) {
    recordHit(`code:${ip}`, WINDOW);
    return { ok: false, error: "That code isn’t right." };
  }
  await startOwnerSession(version);
  redirect("/secretariat/codes");
}

export async function logout() {
  await endSession();
  redirect("/");
}

function validateNewCode(code: string, confirm: string): string | null {
  if (code.length < MIN_CODE_LENGTH) return `Use at least ${MIN_CODE_LENGTH} characters.`;
  if (code.length > 64) return "Keep it under 64 characters.";
  if (code !== confirm) return "The two codes don’t match.";
  return null;
}

async function storeCode(key: string, code: string) {
  const hash = await hashCode(code);
  await db.appSetting.upsert({ where: { key }, create: { key, value: hash }, update: { value: hash } });
  return codeVersion(hash);
}

async function isChairCode(code: string) {
  return !!(await db.committee.findFirst({ where: { chairCode: { equals: code, mode: "insensitive" } } }));
}

/**
 * First run: sets the owner code and the secretariat code together, then signs in as owner.
 * If a secretariat code already exists from before owner codes, a signed-in secretariat may set the owner code once.
 */
export async function setupCodes(_prev: FormState, fd: FormData): Promise<FormState> {
  if (await ownerCodeHash()) return { ok: false, error: "Setup is already done. Use your codes to sign in." };
  const owner = normaliseAccessCode(str(fd, "ownerCode"));
  const ownerErr = validateNewCode(owner, normaliseAccessCode(str(fd, "ownerConfirm")));
  if (ownerErr) return { ok: false, error: ownerErr, fieldErrors: { ownerCode: ownerErr } };

  if (await secretariatCodeHash()) {
    const user = await getCurrentUser();
    if (user?.role !== "SECRETARIAT") return { ok: false, error: "Sign in with the secretariat code first, then come back to this page." };
    if ((await checkSecretariatCode(owner)).ok) return { ok: false, error: "The owner code must be different from the secretariat code.", fieldErrors: { ownerCode: "Pick a different code." } };
    if (await isChairCode(owner)) return { ok: false, error: "That code is already used as a chair code. Pick a different one." };
    await startOwnerSession(await storeCode(OWNER_CODE_KEY, owner));
    redirect("/secretariat/codes");
  }

  const sec = normaliseAccessCode(str(fd, "code"));
  const secErr = validateNewCode(sec, normaliseAccessCode(str(fd, "confirm")));
  if (secErr) return { ok: false, error: secErr, fieldErrors: { code: secErr } };
  if (owner.toLowerCase() === sec.toLowerCase()) {
    return { ok: false, error: "The owner code and the secretariat code must be different.", fieldErrors: { code: "Pick a different code." } };
  }
  await storeCode(SECRETARIAT_CODE_KEY, sec);
  await startOwnerSession(await storeCode(OWNER_CODE_KEY, owner));
  redirect("/secretariat/codes");
}

type Guarded = { ok: false; state: FormState } | { ok: true; code: string };

async function guardedChange(fd: FormData, other: (code: string) => Promise<boolean>, otherName: string): Promise<Guarded> {
  try {
    await assertOwner();
  } catch (e) {
    return { ok: false, state: { ok: false, error: (e as Error).message } };
  }
  const code = normaliseAccessCode(str(fd, "code"));
  const err = validateNewCode(code, normaliseAccessCode(str(fd, "confirm")));
  if (err) return { ok: false, state: { ok: false, error: err, fieldErrors: { code: err } } };
  if (await isChairCode(code)) return { ok: false, state: { ok: false, error: "That code is already used as a chair code. Pick a different one." } };
  if (await other(code)) return { ok: false, state: { ok: false, error: `That is the ${otherName} code. Pick a different one.` } };
  return { ok: true, code };
}

/** Owner only. Signs out everyone using the old secretariat code; the owner stays signed in. */
export async function changeSecretariatCode(_prev: FormState, fd: FormData): Promise<FormState> {
  const r = await guardedChange(fd, async (c) => (await checkOwnerCode(c)).ok, "owner");
  if (!r.ok) return r.state;
  await storeCode(SECRETARIAT_CODE_KEY, r.code);
  return { ok: true, message: "Secretariat code changed. Anyone signed in with the old code has been signed out." };
}

/** Owner only. */
export async function changeOwnerCode(_prev: FormState, fd: FormData): Promise<FormState> {
  const r = await guardedChange(fd, async (c) => (await checkSecretariatCode(c)).ok, "secretariat");
  if (!r.ok) return r.state;
  await startOwnerSession(await storeCode(OWNER_CODE_KEY, r.code));
  return { ok: true, message: "Owner code changed. Use the new one next time." };
}
