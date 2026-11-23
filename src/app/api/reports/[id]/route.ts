import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await db.chairReport.findUnique({ where: { id } });
  if (!report) return new Response("Not found", { status: 404 });
  const safeName = report.fileName.replace(/[^\w.\- ]+/g, "_");
  return new Response(Buffer.from(report.data), {
    headers: {
      "Content-Type": report.mimeType || "application/octet-stream",
      "Content-Length": String(report.size),
      "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(report.fileName)}`,
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
