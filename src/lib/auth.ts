import "server-only";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import bcrypt from "bcryptjs";
import { cache } from "react";
import type { Committee } from "@prisma/client";
import { db } from "./db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./session-token";

export const SECRETARIAT_CODE_KEY = "secretariatCodeHash";
export const MIN_CODE_LENGTH = 6;

/** A fingerprint of the current code, so changing a code signs out everyone who used the old one. */
export function codeVersion(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return h;
}

export function normaliseAccessCode(code: string) {
  return code.trim().replace(/\s+/g, " ");
}

/** The stored secretariat code hash, or a hash of SECRETARIAT_CODE from the environment as a fallback. */
export async function secretariatCodeHash(): Promise<string | null> {
  const row = await db.appSetting.findUnique({ where: { key: SECRETARIAT_CODE_KEY } });
  if (row?.value) return row.value;
  const env = process.env.SECRETARIAT_CODE;
  if (env && env.length >= MIN_CODE_LENGTH) return `env:${env}`;
  return null;
}

export async function checkSecretariatCode(code: string): Promise<{ ok: boolean; version: number }> {
  const stored = await secretariatCodeHash();
  if (!stored) return { ok: false, version: 0 };
  const ok = stored.startsWith("env:")
    ? normaliseAccessCode(code) === stored.slice(4)
    : await bcrypt.compare(normaliseAccessCode(code), stored);
  return { ok, version: codeVersion(stored) };
}

export async function hashCode(code: string) {
  return bcrypt.hash(normaliseAccessCode(code), 11);
}

export async function startChairSession(committee: Committee) {
  await setCookie(await signSession({ sub: committee.id, role: "CHAIR", pv: codeVersion(committee.chairCode ?? "") }));
}

export async function startSecretariatSession(version: number) {
  await setCookie(await signSession({ sub: "secretariat", role: "SECRETARIAT", pv: version }));
}

async function setCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export type CurrentUser = {
  role: "SECRETARIAT" | "CHAIR";
  /** Display label, e.g. "GA chair" or "Secretariat" */
  name: string;
  committeeId: string | null;
  committee: Committee | null;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token);
  if (!payload) return null;
  if (payload.role === "SECRETARIAT") {
    const stored = await secretariatCodeHash();
    if (!stored || codeVersion(stored) !== payload.pv) return null;
    return { role: "SECRETARIAT", name: "Secretariat", committeeId: null, committee: null };
  }
  const committee = await db.committee.findUnique({ where: { id: payload.sub } });
  if (!committee?.chairCode || codeVersion(committee.chairCode) !== payload.pv) return null;
  return { role: "CHAIR", name: `${committee.code} chair`, committeeId: committee.id, committee };
});

export async function requireUser(loginPath = "/login/chair"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(loginPath);
  return user;
}

function chairHome(user: CurrentUser) {
  return user.committee ? `/chair/${encodeURIComponent(user.committee.code)}` : "/";
}

export async function requireSecretariat(): Promise<CurrentUser> {
  const user = await requireUser("/login/secretariat");
  if (user.role !== "SECRETARIAT") redirect(chairHome(user));
  return user;
}

/** Chairs may only act on their own committee; the secretariat may act on any. */
export async function requireCommitteeAccess(code: string) {
  const user = await requireUser();
  const committee = await db.committee.findUnique({ where: { code: decodeURIComponent(code) } });
  if (!committee) notFound();
  if (user.role !== "SECRETARIAT" && user.committeeId !== committee.id) redirect(chairHome(user));
  return { user, committee };
}

/** Same check for server actions, by committee id. Throws instead of redirecting. */
export async function assertCommitteeAccess(committeeId: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("You are signed out. Please enter your code again.");
  if (user.role !== "SECRETARIAT" && user.committeeId !== committeeId) {
    throw new Error("You do not have access to this committee.");
  }
  return user;
}

export async function assertSecretariat(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "SECRETARIAT") throw new Error("Only the secretariat can do this.");
  return user;
}
