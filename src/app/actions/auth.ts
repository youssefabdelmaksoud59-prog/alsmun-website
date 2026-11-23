"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  MIN_CODE_LENGTH,
  SECRETARIAT_CODE_KEY,
  assertSecretariat,
  checkSecretariatCode,
  codeVersion,
  endSession,
  hashCode,
  normaliseAccessCode,
  secretariatCodeHash,
  startChairSession,
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

async function storeSecretariatCode(code: string) {
  const hash = await hashCode(code);
  await db.appSetting.upsert({ where: { key: SECRETARIAT_CODE_KEY }, create: { key: SECRETARIAT_CODE_KEY, value: hash }, update: { value: hash } });
  return codeVersion(hash);
}

/** First run only: sets the secretariat code when none exists yet. */
export async function setupSecretariatCode(_prev: FormState, fd: FormData): Promise<FormState> {
  if (await secretariatCodeHash()) return { ok: false, error: "The secretariat code is already set. Use it to sign in." };
  const code = normaliseAccessCode(str(fd, "code"));
  const err = validateNewCode(code, normaliseAccessCode(str(fd, "confirm")));
  if (err) return { ok: false, error: err, fieldErrors: { code: err } };
  await startSecretariatSession(await storeSecretariatCode(code));
  redirect("/secretariat");
}

export async function changeSecretariatCode(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    await assertSecretariat();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const code = normaliseAccessCode(str(fd, "code"));
  const err = validateNewCode(code, normaliseAccessCode(str(fd, "confirm")));
  if (err) return { ok: false, error: err, fieldErrors: { code: err } };
  if (await db.committee.findFirst({ where: { chairCode: { equals: code, mode: "insensitive" } } })) {
    return { ok: false, error: "That code is already used as a chair code. Pick a different one." };
  }
  await startSecretariatSession(await storeSecretariatCode(code));
  return { ok: true, message: "Secretariat code changed. Anyone signed in with the old code has been signed out." };
}
