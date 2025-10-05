import "server-only";
import type { ReadableStream } from "stream/web";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export type SupportedExtractMime =
  | "application/pdf"
  | typeof DOCX_MIME
  | typeof XLSX_MIME;

export async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetch_failed:${res.status}`);
  }
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

export async function extractPdf(buffer: Buffer): Promise<string> {
  const mod: any = await import("pdf-parse");
  const pdfParse: any = mod?.default ?? mod;
  const result = await pdfParse(buffer);
  return typeof result?.text === "string" ? result.text : "";
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
