import "server-only";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { db } from "./db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./session-token";

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 11);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

/** A cheap fingerprint of the password hash so changing a password signs out other devices. */
export function passwordVersion(hash: string) {
  let h = 0;
  for (let i = 0; i < hash.length; i++) h = (h * 31 + hash.charCodeAt(i)) | 0;
  return h;
}

export async function startSession(user: { id: string; role: "SECRETARIAT" | "CHAIR"; passwordHash: string }) {
  const token = await signSession({ sub: user.id, role: user.role, pv: passwordVersion(user.passwordHash) });
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

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token);
  if (!payload) return null;
  const user = await db.user.findUnique({
    where: { id: payload.sub },
    include: { committee: true },
  });
  if (!user || !user.active || passwordVersion(user.passwordHash) !== payload.pv) return null;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

function chairHome(user: CurrentUser) {
  return user.committee ? `/chair/${encodeURIComponent(user.committee.code)}` : "/chair";
}

export async function requireSecretariat(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "SECRETARIAT") redirect(chairHome(user));
  return user;
}

/** Chairs may only act on their own committee; secretariat may act on any. */
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
  if (!user) throw new Error("You are signed out. Please sign in again.");
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
