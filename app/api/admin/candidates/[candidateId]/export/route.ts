import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import logger from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const session = await requireAuth();
  const { candidateId } = await params;

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          slug: true,
          department: true,
          location: true,
          employmentType: true,
        },
      },
      invite: {
        select: {
          id: true,
          candidateName: true,
          candidateEmail: true,
          createdAt: true,
          expiresAt: true,
          notes: true,
          status: true,
        },
      },
      submission: {
        include: {
          itemScores: true,
          dimensionEstimates: true,
        },
      },
      reviews: {
        orderBy: { assignedAt: "desc" },
      },
    },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    exportedBy: session.email,
    candidate: {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      stage: candidate.stage,
      status: candidate.status,
      currentStage: candidate.currentStage,
      completionPercent: candidate.completionPercent,
      reportStatus: candidate.reportStatus,
      lastActiveAt: candidate.lastActiveAt,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    },
    job: candidate.job,
    invite: candidate.invite,
    submission: candidate.submission
      ? {
          id: candidate.submission.id,
          consentGiven: candidate.submission.consentGiven,
          consentAt: candidate.submission.consentAt,
          cvPath: candidate.submission.cvPath,
          coverLetter: candidate.submission.coverLetter,
          projects: candidate.submission.projects,
          roleAnswers: candidate.submission.roleAnswers,
          standardAnswers: candidate.submission.standardAnswers,
          psychoAnswers: candidate.submission.psychoAnswers,
          psychoScores: candidate.submission.psychoScores,
          finalReflection: candidate.submission.finalReflection,
          submittedAt: candidate.submission.submittedAt,
          synthesisJson: candidate.submission.synthesisJson,
          createdAt: candidate.submission.createdAt,
          updatedAt: candidate.submission.updatedAt,
          itemScores: candidate.submission.itemScores,
          dimensionEstimates: candidate.submission.dimensionEstimates,
        }
      : null,
    reviews: candidate.reviews,
  };

  await prisma.auditLog.create({
    data: {
      actorEmail: session.email,
      action: "CANDIDATE_DATA_EXPORTED",
      entityType: "CANDIDATE",
      entityId: candidate.id,
      jobId: candidate.jobId,
    },
  });
  logger.info(
    { actorEmail: session.email, candidateId: candidate.id },
    "Candidate data exported"
  );

  const filename = `candidate-${candidate.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${candidate.id.slice(0, 8)}.json`;

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
