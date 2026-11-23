import ExcelJS from "exceljs";
import { getScoreSheet } from "@/lib/scoresheet";
import { committeeForExport, exportFileName } from "@/lib/export-auth";
import { POINTS } from "@/lib/scoring";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const r = await committeeForExport((await params).code);
  if ("error" in r) return r.error;
  const { committee } = r;
  const [sheet, settings] = await Promise.all([getScoreSheet(committee.id), getSettings()]);

  const wb = new ExcelJS.Workbook();
  wb.creator = settings.conferenceName;
  wb.created = new Date();
  const ws = wb.addWorksheet(committee.code, { views: [{ state: "frozen", ySplit: 3 }] });
  ws.mergeCells("A1:H1");
  ws.getCell("A1").value = `${settings.conferenceName} · ${committee.code} (${committee.name}) score sheet`;
  ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF0B1F3D" } };
  ws.mergeCells("A2:H2");
  ws.getCell("A2").value = `Generated ${new Date().toUTCString()} · POI ${POINTS.POI}, Speech ${POINTS.SPEECH}, Amendment chosen ${POINTS.AMENDMENT}, Resolution chosen ${POINTS.RESOLUTION}`;
  ws.getCell("A2").font = { italic: true, size: 9, color: { argb: "FF64748B" } };

  const header = ["Rank", "Delegation", "POIs", "Speeches", "Amendments chosen", "Resolutions chosen", "Sessions attended", "Total points"];
  const hr = ws.addRow(header);
  hr.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF163F72" } };
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  hr.height = 30;
  for (const row of sheet) {
    const added = ws.addRow([row.rank, row.delegation, row.poi, row.speech, row.amendment, row.resolution, row.sessions ? `${row.attended}/${row.sessions}` : "", row.total]);
    added.getCell(8).font = { bold: true };
    if (row.rank <= 3 && row.total > 0) {
      added.eachCell((c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3C4" } }));
    }
  }
  ws.columns = [{ width: 7 }, { width: 34 }, { width: 8 }, { width: 10 }, { width: 13 }, { width: 13 }, { width: 12 }, { width: 11 }];
  for (let i = 4; i <= ws.rowCount; i++) {
    for (const col of [1, 3, 4, 5, 6, 7, 8]) ws.getRow(i).getCell(col).alignment = { horizontal: "center" };
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${exportFileName(committee.code, "xlsx")}"`,
      "Cache-Control": "no-store",
    },
  });
}
