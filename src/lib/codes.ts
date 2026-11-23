import { randomBytes } from "crypto";

// No 0/O/1/I/L to avoid confusion when read aloud or copied by hand.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function trackingCode(prefix: "R" | "A"): string {
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return `${prefix}-${out.slice(0, 4)}-${out.slice(4)}`;
}

export function normaliseCode(input: string): string {
  const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length !== 9) return input.trim().toUpperCase();
  return `${clean[0]}-${clean.slice(1, 5)}-${clean.slice(5)}`;
}

export function resolutionRef(committeeCode: string, n: number) {
  return `${committeeCode}/R/${n}`;
}
export function amendmentRef(committeeCode: string, n: number) {
  return `${committeeCode}/A/${n}`;
}
