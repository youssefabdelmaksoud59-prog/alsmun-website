import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "alsmun_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days, long enough for the whole conference

/** sub is the committee id for chairs and "secretariat" for the secretariat. pv changes when the code changes. */
export type SessionPayload = { sub: string; role: "SECRETARIAT" | "CHAIR"; pv: number };

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to a random string of at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
