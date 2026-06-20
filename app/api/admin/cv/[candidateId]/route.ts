import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "/var/recruit/uploads";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { candidateId } = await params;

  const submission = await prisma.submission.findUnique({
    where: { candidateId },
    select: { cvPath: true },
  });

  if (!submission?.cvPath) {
    return NextResponse.json({ error: "No CV found" }, { status: 404 });
  }

  const absolutePath = path.join(UPLOADS_DIR, submission.cvPath);
  if (!absolutePath.startsWith(path.resolve(UPLOADS_DIR))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    await fs.access(absolutePath, fs.constants.R_OK);
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const ext = path.extname(absolutePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  const fileBuffer = await fs.readFile(absolutePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": mimeTypes[ext] ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${path.basename(absolutePath)}"`,
      "Cache-Control": "no-store",
    },
  });
}
