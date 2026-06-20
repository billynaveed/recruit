import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { extractCvText } from "@/lib/cv-extract";

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "/var/recruit/uploads";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const candidateId = form.get("candidateId") as string | null;
    const field = (form.get("field") as string | null) ?? "cv";

    if (!file || !candidateId) {
      return NextResponse.json({ error: "Missing file or candidateId" }, { status: 400 });
    }

    // Validate candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Invalid candidate" }, { status: 403 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 400 });
    }

    // Validate file extension
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "File type not allowed. Please upload a PDF or Word document." }, { status: 400 });
    }

    // Validate MIME type
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: "File type not allowed." }, { status: 400 });
    }

    // Write to disk
    const candidateDir = path.join(UPLOADS_DIR, candidateId);
    await fs.mkdir(candidateDir, { recursive: true });

    const safeName = `${field}_${randomUUID()}${ext}`;
    const filePath = path.join(candidateDir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const storedPath = `${candidateId}/${safeName}`;

    // Update submission
    if (field === "cv") {
      const extracted = await extractCvText(filePath);
      await prisma.submission.update({
        where: { candidateId },
        data: {
          cvPath: storedPath,
          cvText: extracted.text,
          cvExtractedAt: extracted.text ? new Date() : null,
          cvExtractError: extracted.error,
        },
      });
      logger.info(
        {
          candidateId,
          field,
          storedPath,
          extractedChars: extracted.text?.length ?? 0,
          extractError: extracted.error,
        },
        "cv uploaded and extracted"
      );
    } else {
      logger.info({ candidateId, field, storedPath }, "file uploaded");
    }

    return NextResponse.json({ path: storedPath });
  } catch (err) {
    logger.error({ err }, "file upload error");
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
