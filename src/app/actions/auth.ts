"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { endSession, getCurrentUser, hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { clientIp, isLimited, recordHit } from "@/lib/rate-limit";
import { fieldErrors, str, type FormState } from "@/lib/form";

function safeNext(next: string, role: "SECRETARIAT" | "CHAIR", committeeCode?: string) {
  // Send chairs straight to their committee: chaining a second redirect after a server action can stall.
  const fallback = role === "SECRETARIAT" ? "/secretariat" : committeeCode ? `/chair/${encodeURIComponent(committeeCode)}` : "/chair";
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  if (role === "CHAIR" && next.startsWith("/secretariat")) return fallback;
  return next;
}

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").trim().toLowerCase();
  const password = str(fd, "password");
  const ip = await clientIp();
  // Only failed attempts count, so busy chairs signing in on several devices are never locked out.
  const WINDOW = 15 * 60 * 1000;
  if (isLimited(`login:${ip}`, 30) || isLimited(`login:${email}`, 10)) {
    return { ok: false, error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }
  if (!email || !password) return { ok: false, error: "Enter your email and password." };
  const user = await db.user.findUnique({ where: { email }, include: { committee: { select: { code: true } } } });
  // Compare against a dummy hash when the user is missing, so timing doesn't reveal which emails exist.
  const ok = await verifyPassword(password, user?.passwordHash ?? "$2b$11$hNkHbRTp5jVj2jeCI2od/uF1fr2AHTttrSgGKQhemROTqkMiaPN0m");
  if (!user || !ok) {
    recordHit(`login:${ip}`, WINDOW);
    recordHit(`login:${email}`, WINDOW);
    return { ok: false, error: "That email and password don’t match an account." };
  }
  if (!user.active) return { ok: false, error: "This account has been disabled. Contact the secretariat." };
  await startSession(user);
  let next = safeNext(str(fd, "next"), user.role, user.committee?.code);
  if (user.role === "CHAIR" && next === "/chair" && user.committee) next = `/chair/${encodeURIComponent(user.committee.code)}`;
  redirect(next);
}

export async function logout() {
  await endSession();
  redirect("/");
}

const setupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name.").max(80),
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    password: z.string().min(10, "Use at least 10 characters.").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The passwords don’t match." });

/** First-run only: creates the first secretariat account when no users exist. */
export async function setupFirstAccount(_prev: FormState, fd: FormData): Promise<FormState> {
  if ((await db.user.count()) > 0) return { ok: false, error: "Setup is already complete. Please sign in." };
  const parsed = setupSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const user = await db.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password), role: "SECRETARIAT" },
  });
  await startSession(user);
  redirect("/secretariat");
}

const pwSchema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    password: z.string().min(10, "Use at least 10 characters.").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The passwords don’t match." });

export async function changeOwnPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You are signed out." };
  const parsed = pwSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!(await verifyPassword(parsed.data.current, user.passwordHash))) {
    return { ok: false, error: "Your current password is wrong.", fieldErrors: { current: "This is not your current password." } };
  }
  const updated = await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } });
  await startSession(updated);
  return { ok: true, message: "Password changed. Other devices have been signed out." };
}
