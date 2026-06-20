import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { CandidateStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import logger from "@/lib/logger";
import type { SynthesisResult } from "@/lib/scoring/synthesis";
import { PUBLIC_BASE_URL } from "@/lib/base-url";

// Stages that count as "submitted enough to export"
const EXPORTABLE_STAGES: CandidateStage[] = [
  CandidateStage.COMPLETED,
  CandidateStage.REVIEWING,
  CandidateStage.SHORTLISTED,
  CandidateStage.OFFER,
  CandidateStage.HIRED,
  CandidateStage.REJECTED,
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await requireAuth();
  const { jobId } = await params;
  const url = new URL(request.url);
  const idsParam = url.searchParams.get("ids");
  const ids = idsParam ? idsParam.split(",").map((s) => s.trim()).filter(Boolean) : null;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      slug: true,
      department: true,
      location: true,
      employmentType: true,
      roleQuestions: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, prompt: true },
      },
    },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const standardQuestions = await prisma.standardQuestion.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, prompt: true },
  });

  const candidates = await prisma.candidate.findMany({
    where: {
      jobId,
      ...(ids
        ? { id: { in: ids } }
        : { stage: { in: EXPORTABLE_STAGES } }),
    },
    orderBy: { createdAt: "desc" },
    include: { submission: true },
  });

  if (candidates.length === 0) {
    return NextResponse.json({ error: "No candidates to export" }, { status: 404 });
  }

  // Build rows
  const rows = candidates.map((c) => {
    const sub = c.submission;
    const synthesis = sub?.synthesisJson as SynthesisResult | null;
    const roleAnswers = (sub?.roleAnswers ?? {}) as Record<string, string>;
    const standardAnswers = (sub?.standardAnswers ?? {}) as Record<string, string>;

    const row: Record<string, unknown> = {
      "Job title": job.title,
      Department: job.department ?? "",
      Location: job.location ?? "",
      "Employment type": job.employmentType ?? "",
      "Candidate name": c.name,
      Email: c.email,
      Stage: c.stage,
      "Role fit": synthesis?.roleFitRead?.band ?? "",
      "Submitted at": sub?.submittedAt ? sub.submittedAt.toISOString() : "",
      "Created at": c.createdAt.toISOString(),
      "CV download": sub?.cvPath
        ? `${PUBLIC_BASE_URL}/api/admin/cv/${c.id}`
        : "",
      "Cover letter": sub?.coverLetter ?? "",
    };

    for (const q of job.roleQuestions) {
      row[`Role Q: ${truncate(q.prompt, 80)}`] = roleAnswers[q.id] ?? "";
    }
    for (const q of standardQuestions) {
      row[`Standard Q: ${truncate(q.prompt, 80)}`] = standardAnswers[q.id] ?? "";
    }
    row["Final reflection"] = sub?.finalReflection ?? "";
    row["Admin notes"] = c.notes ?? "";

    return row;
  });

  // Build sheet
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths heuristically (cap wide text columns at 60).
  const colWidths = Object.keys(rows[0]).map((header) => {
    const max = Math.max(
      header.length,
      ...rows.map((r) => String(r[header] ?? "").length)
    );
    return { wch: Math.min(60, Math.max(12, max + 2)) };
  });
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");

  const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  await prisma.auditLog.create({
    data: {
      actorEmail: session.email,
      action: "CANDIDATES_EXPORTED_XLSX",
      entityType: "JOB",
      entityId: jobId,
      jobId,
      metadataJson: JSON.stringify({
        candidateCount: candidates.length,
        scoped: ids ? "selected" : "all-submitted",
      }),
    },
  });
  logger.info(
    { actorEmail: session.email, jobId, count: candidates.length, scoped: ids ? "selected" : "all" },
    "Candidates exported to xlsx"
  );

  const filename = sanitizeFilename(
    `${job.slug || job.title}-candidates-${new Date().toISOString().slice(0, 10)}.xlsx`
  );

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
}
