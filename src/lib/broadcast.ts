import { db } from "./db";

/** Announcements stay up until the secretariat removes them; the newest few are shown. */
export async function activeAnnouncements(take = 3) {
  return db.announcement.findMany({ orderBy: { createdAt: "desc" }, take });
}

export async function publishedCrisis(committeeId: string, take?: number) {
  return db.crisisUpdate.findMany({
    where: { committeeId, publishAt: { lte: new Date() } },
    orderBy: { publishAt: "desc" },
    take,
  });
}
