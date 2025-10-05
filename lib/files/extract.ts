import "server-only";
import type { ReadableStream } from "stream/web";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export type SupportedExtractMime =
  | "application/pdf"
  | typeof DOCX_MIME
  | typeof XLSX_MIME
  | "text/csv";

export async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetch_failed:${res.status}`);
  }
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

export async function extractPdf(buffer: Buffer): Promise<string> {
  try {
    const mod: any = await import("pdf-parse");
    const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    if (mod?.PDFParse) {
      const Parser = mod.PDFParse;
      const parser = new Parser({ data: u8 });
      const res = await parser.getText();
      return typeof res?.text === "string" ? res.text : "";
    }
    if (typeof mod?.pdf === "function") {
      const res = await mod.pdf(u8);
      return typeof res?.text === "string" ? res.text : "";
    }
    if (typeof mod?.default === "function") {
      const res = await mod.default(u8);
      return typeof res?.text === "string" ? res.text : "";
    }
    console.error("extractPdf: unsupported pdf-parse export shape", {
      keys: mod && typeof mod === "object" ? Object.keys(mod) : [],
      types: {
        PDFParse: typeof mod?.PDFParse,
        pdf: typeof mod?.pdf,
        default: typeof mod?.default,
      },
    });
    throw new Error("pdf_parse_export_not_supported");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("extractPdf: pdf-parse failed", err);
    throw new Error(`pdf_extraction_failed:${message}`);
  }
}

export async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = (await import("mammoth")) as any;
  const { value } = await mammoth.extractRawText({ buffer });
  return typeof value === "string" ? value : "";
}

export async function extractXlsx(buffer: Buffer): Promise<string> {
  const XLSX = (await import("xlsx")) as any;
  const wb = XLSX.read(buffer, { type: "buffer" });
  const parts: string[] = [];
  const sheetNames: string[] = wb.SheetNames || [];
  const maxSheets = 3;
  const maxLinesPerSheet = 300;
  for (const name of sheetNames.slice(0, maxSheets)) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    const csv: string = XLSX.utils.sheet_to_csv(ws, { FS: "\t" });
    const lines = csv.split("\n").slice(0, maxLinesPerSheet);
    parts.push(`== Sheet: ${name} ==\n` + lines.join("\n"));
  }
  return parts.join("\n\n");
}

export async function extractCsv(buffer: Buffer): Promise<string> {
  const Papa = (await import("papaparse")) as any;
  const text = buffer.toString("utf8");
  const result = Papa.parse(text, { header: false, skipEmptyLines: true });
  const rows: any[] = Array.isArray(result?.data) ? result.data : [];
  const maxRows = 500;
  const maxCols = 40;
  const lines = rows.slice(0, maxRows).map((r: any[]) =>
    (Array.isArray(r) ? r : [String(r)])
      .slice(0, maxCols)
      .map((c) => String(c))
      .join("\t"),
  );
  return lines.join("\n");
}

export async function extractFileToText(opts: {
  url: string;
  mediaType: SupportedExtractMime;
  maxChars?: number;
}): Promise<string> {
  const { url, mediaType, maxChars = 20000 } = opts;
  const buffer = await fetchBuffer(url);
  let text = "";
  if (mediaType === "application/pdf") {
    text = await extractPdf(buffer);
  } else if (mediaType === DOCX_MIME) {
    text = await extractDocx(buffer);
  } else if (mediaType === XLSX_MIME) {
    text = await extractXlsx(buffer);
  } else if (mediaType === "text/csv") {
    text = await extractCsv(buffer);
  } else {
    throw new Error(`unsupported_media:${mediaType}`);
  }

  if (!text) return "";
  // Normalize whitespace and truncate
  const normalized = text.replace(/\r\n?/g, "\n").replace(/[\t\u00A0]+/g, " ");
  return normalized.length > maxChars
    ? normalized.slice(0, maxChars) + "\n…(truncated)…"
    : normalized;
}
