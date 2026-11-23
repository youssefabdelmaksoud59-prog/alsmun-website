import { cache } from "react";
import { db } from "./db";

export type ConferenceSettings = {
  conferenceName: string;
  tagline: string;
  dates: string;
  venue: string;
  announcement: string;
};

export const DEFAULT_SETTINGS: ConferenceSettings = {
  conferenceName: "ALSMUN V",
  tagline: "Conference portal for delegates, chairs and the secretariat",
  dates: "",
  venue: "",
  announcement: "",
};

export const getSettings = cache(async (): Promise<ConferenceSettings> => {
  const rows = await db.appSetting.findMany();
  const out = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    if (r.key in out) (out as Record<string, string>)[r.key] = r.value;
  }
  return out;
});

export const getCommittees = cache(async () =>
  db.committee.findMany({ orderBy: [{ sortOrder: "asc" }, { code: "asc" }] }),
);

export const getCommitteeByCode = cache(async (code: string) =>
  db.committee.findUnique({ where: { code: decodeURIComponent(code) } }),
);

export function delegateBase(code: string) {
  return `/delegate/${encodeURIComponent(code)}`;
}
