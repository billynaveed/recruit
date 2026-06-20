import fs from "fs/promises";
import path from "path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

// pdf-parse v2 uses pdfjs-dist's worker. Next's bundler rewrites import.meta.url
// inside the route handler so the auto-detect can't find the worker .mjs at
// runtime. Resolve and pin it explicitly using createRequire (the worker file
// ships with pdfjs-dist and is installed in node_modules at deploy time).
let workerConfigured = false;
function configureWorker() {
  if (workerConfigured) return;
  try {
    const req = createRequire(import.meta.url);
    const workerPath = req.resolve("pdfjs-dist/build/pdf.worker.mjs");
    PDFParse.setWorker(pathToFileURL(workerPath).href);
    workerConfigured = true;
  } catch {
    // Fall through; pdf-parse will surface a clearer error during getText().
    workerConfigured = true;
  }
}

export interface CvExtractionResult {
  text: string | null;
  error: string | null;
}

/**
 * Extract plain text from a candidate-uploaded CV file. Supports PDF and DOCX.
 * Old .doc (binary Word) is intentionally not supported — we ask candidates
 * to re-export to PDF or DOCX rather than ship a fragile binary parser.
 *
 * Never throws; on failure returns { text: null, error: <reason> }. Errors
 * are stored on the submission so admins can see why text is missing.
 */
export async function extractCvText(absolutePath: string): Promise<CvExtractionResult> {
  const ext = path.extname(absolutePath).toLowerCase();
  try {
    const buffer = await fs.readFile(absolutePath);
    if (ext === ".pdf") {
      configureWorker();
      const parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      await parser.destroy();
      return { text: normalize(parsed.text ?? ""), error: null };
    }
    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ buffer });
      return { text: normalize(result.value), error: null };
    }
    if (ext === ".doc") {
      return {
        text: null,
        error: "Old .doc format is not supported. Ask the candidate to re-export as PDF or DOCX.",
      };
    }
    return { text: null, error: `Unsupported extension ${ext || "(none)"}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { text: null, error: `Extraction failed: ${message.slice(0, 240)}` };
  }
}

export function normalize(raw: string): string | null {
  if (!raw) return null;
  // Postgres TEXT rejects NUL bytes (0x00) with "invalid byte sequence for
  // encoding UTF8" and fails the upload write. Some PDFs (mixed-encoding
  // fonts, embedded objects) leak NULs into pdf-parse output, so strip them
  // before anything else touches the string.
  const cleaned = raw
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}
