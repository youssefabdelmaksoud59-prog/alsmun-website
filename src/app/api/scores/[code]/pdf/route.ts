import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";
import { getScoreSheet } from "@/lib/scoresheet";
import { committeeForExport, exportFileName } from "@/lib/export-auth";
import { POINTS } from "@/lib/scoring";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";

const NAVY = rgb(0.043, 0.122, 0.239);
const BLUE = rgb(0.086, 0.247, 0.447);
const GOLD = rgb(1, 0.953, 0.769);
const GREY = rgb(0.39, 0.45, 0.55);

/** Standard PDF fonts only cover WinAnsi; replace anything else so names never crash the export. */
function safe(text: string) {
  return text.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const r = await committeeForExport((await params).code);
  if ("error" in r) return r.error;
  const { committee } = r;
  const [sheet, settings] = await Promise.all([getScoreSheet(committee.id), getSettings()]);

  const pdf = await PDFDocument.create();
  pdf.setTitle(`${committee.code} score sheet`);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let logo: Awaited<ReturnType<typeof pdf.embedPng>> | null = null;
  try {
    logo = await pdf.embedPng(await readFile(path.join(process.cwd(), "public", "icon-192.png")));
  } catch {
    logo = null;
  }

  const W = 595.28, H = 841.89, M = 40; // A4 portrait
  const cols = [
    { label: "#", w: 30, align: "c" },
    { label: "Delegation", w: 175, align: "l" },
    { label: "POIs", w: 45, align: "c" },
    { label: "Speeches", w: 55, align: "c" },
    { label: "Amend.", w: 50, align: "c" },
    { label: "Resol.", w: 45, align: "c" },
    { label: "Attend.", w: 55, align: "c" },
    { label: "Total", w: 60, align: "c" },
  ] as const;
  const rowH = 20;

  let page = pdf.addPage([W, H]);
  let y = H - M;

  const header = (first: boolean) => {
    if (first) {
      if (logo) page.drawImage(logo, { x: M, y: y - 44, width: 44, height: 44 });
      const x0 = logo ? M + 56 : M;
      page.drawText(safe(settings.conferenceName), { x: x0, y: y - 16, size: 16, font: bold, color: NAVY });
      page.drawText(safe(`${committee.code} · ${committee.name} · Score sheet`), { x: x0, y: y - 32, size: 11, font, color: BLUE });
      page.drawText(safe(`Generated ${new Date().toUTCString()}   POI ${POINTS.POI} · Speech ${POINTS.SPEECH} · Amendment ${POINTS.AMENDMENT} · Resolution ${POINTS.RESOLUTION}`), { x: x0, y: y - 46, size: 8, font, color: GREY });
      y -= 64;
    }
    page.drawRectangle({ x: M, y: y - rowH, width: W - 2 * M, height: rowH, color: BLUE });
    let x = M;
    for (const c of cols) {
      const tw = bold.widthOfTextAtSize(c.label, 9);
      page.drawText(c.label, { x: c.align === "c" ? x + (c.w - tw) / 2 : x + 6, y: y - 14, size: 9, font: bold, color: rgb(1, 1, 1) });
      x += c.w;
    }
    y -= rowH;
  };

  header(true);
  if (sheet.length === 0) {
    page.drawText("No delegations yet.", { x: M, y: y - 20, size: 10, font, color: GREY });
  }
  sheet.forEach((row, i) => {
    if (y - rowH < M) {
      page = pdf.addPage([W, H]);
      y = H - M;
      header(false);
    }
    if (row.rank <= 3 && row.total > 0) page.drawRectangle({ x: M, y: y - rowH, width: W - 2 * M, height: rowH, color: GOLD });
    else if (i % 2 === 1) page.drawRectangle({ x: M, y: y - rowH, width: W - 2 * M, height: rowH, color: rgb(0.97, 0.98, 0.99) });
    const values = [String(row.rank), row.delegation, String(row.poi), String(row.speech), String(row.amendment), String(row.resolution), row.sessions ? `${row.attended}/${row.sessions}` : "-", String(row.total)];
    let x = M;
    cols.forEach((c, j) => {
      const f = j === 7 || j === 0 ? bold : font;
      let text = safe(values[j]);
      while (f.widthOfTextAtSize(text, 9.5) > c.w - 10 && text.length > 3) text = text.slice(0, -2) + ".";
      const tw = f.widthOfTextAtSize(text, 9.5);
      page.drawText(text, { x: c.align === "c" ? x + (c.w - tw) / 2 : x + 6, y: y - 14, size: 9.5, font: f, color: NAVY });
      x += c.w;
    });
    y -= rowH;
  });

  const pages = pdf.getPages();
  pages.forEach((p, i) => p.drawText(`Page ${i + 1} of ${pages.length}`, { x: W - M - 60, y: 22, size: 8, font, color: GREY }));

  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${exportFileName(committee.code, "pdf")}"`,
      "Cache-Control": "no-store",
    },
  });
}
