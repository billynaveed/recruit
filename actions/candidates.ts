"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import logger from "@/lib/logger";
import { CandidateStage } from "@prisma/client";

async function transitionStage(
  candidateId: string,
  allowedFrom: CandidateStage[],
  to: CandidateStage,
  action: string
): Promise<void> {
  const session = await requireAuth();

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true, name: true, stage: true, jobId: true },
  });

  if (!candidate || !allowedFrom.includes(candidate.stage)) return;

  await prisma.$transaction([
    prisma.candidate.update({
      where: { id: candidateId },
      data: { stage: to },
    }),
    prisma.auditLog.create({
      data: {
        actorEmail: session.email,
        action,
        entityType: "CANDIDATE",
        entityId: candidateId,
        jobId: candidate.jobId,
        metadataJson: JSON.stringify({ from: candidate.stage, to }),
      },
    }),
  ]);

  logger.info({ actorEmail: session.email, candidateId, from: candidate.stage, to }, action);
  revalidatePath(`/admin/candidates/${candidateId}`);
  revalidatePath(`/admin/jobs/${candidate.jobId}`);
  revalidatePath("/admin");
}

export async function shortlistCandidateAction(formData: FormData): Promise<void> {
  const candidateId = String(formData.get("candidateId") ?? "");
  await transitionStage(
    candidateId,
    [CandidateStage.COMPLETED, CandidateStage.REVIEWING],
    CandidateStage.SHORTLISTED,
    "CANDIDATE_SHORTLISTED"
  );
}

export async function rejectCandidateAction(formData: FormData): Promise<void> {
  const candidateId = String(formData.get("candidateId") ?? "");
  await transitionStage(
    candidateId,
    [CandidateStage.COMPLETED, CandidateStage.REVIEWING, CandidateStage.SHORTLISTED],
    CandidateStage.REJECTED,
    "CANDIDATE_REJECTED"
  );
}

export async function restoreToShortlistAction(formData: FormData): Promise<void> {
  const candidateId = String(formData.get("candidateId") ?? "");
  await transitionStage(
    candidateId,
    [CandidateStage.REJECTED],
    CandidateStage.SHORTLISTED,
    "CANDIDATE_RESTORED_TO_SHORTLIST"
  );
}

export async function moveToInReviewAction(formData: FormData): Promise<void> {
  const candidateId = String(formData.get("candidateId") ?? "");
  await transitionStage(
    candidateId,
    [
      CandidateStage.COMPLETED,
      CandidateStage.SHORTLISTED,
      CandidateStage.REJECTED,
    ],
    CandidateStage.REVIEWING,
    "CANDIDATE_MOVED_TO_REVIEWING"
  );
}

export async function archiveCandidateAction(formData: FormData): Promise<void> {
  const candidateId = String(formData.get("candidateId") ?? "");
  await transitionStage(
    candidateId,
    [
      CandidateStage.COMPLETED,
      CandidateStage.REVIEWING,
      CandidateStage.SHORTLISTED,
      CandidateStage.REJECTED,
      CandidateStage.WITHDRAWN,
      CandidateStage.HIRED,
      CandidateStage.OFFER,
    ],
    CandidateStage.ARCHIVED,
    "CANDIDATE_ARCHIVED"
  );
}

export async function unarchiveCandidateAction(formData: FormData): Promise<void> {
  const candidateId = String(formData.get("candidateId") ?? "");
  await transitionStage(
    candidateId,
    [CandidateStage.ARCHIVED],
    CandidateStage.COMPLETED,
    "CANDIDATE_UNARCHIVED"
  );
}

export async function updateCandidateNotesAction(
  candidateId: string,
  notes: string
): Promise<void> {
  const session = await requireAuth();

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true, jobId: true },
  });
  if (!candidate) return;

  const trimmed = notes.trim();
  await prisma.$transaction([
    prisma.candidate.update({
      where: { id: candidateId },
      data: { notes: trimmed || null },
    }),
    prisma.auditLog.create({
      data: {
        actorEmail: session.email,
        action: "CANDIDATE_NOTES_UPDATED",
        entityType: "CANDIDATE",
        entityId: candidateId,
        jobId: candidate.jobId,
        metadataJson: JSON.stringify({ length: trimmed.length }),
      },
    }),
  ]);

  logger.info({ actorEmail: session.email, candidateId, length: trimmed.length }, "CANDIDATE_NOTES_UPDATED");
  revalidatePath(`/admin/candidates/${candidateId}`);
  revalidatePath(`/admin/jobs/${candidate.jobId}`);
}

export async function hireCandidateAction(formData: FormData): Promise<void> {
  const candidateId = String(formData.get("candidateId") ?? "");
  await transitionStage(
    candidateId,
    [CandidateStage.SHORTLISTED, CandidateStage.OFFER],
    CandidateStage.HIRED,
    "CANDIDATE_HIRED"
  );
}

export async function eraseCandidateDataAction(formData: FormData): Promise<void> {
  const session = await requireAuth();
  const candidateId = String(formData.get("candidateId") ?? "");

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true, jobId: true, name: true },
  });
  if (!candidate) return;

  await prisma.$transaction([
    prisma.candidate.update({
      where: { id: candidateId },
      data: {
        name: "[Erased]",
        email: `erased-${candidateId}@erased.invalid`,
        phone: null,
        linkedinUrl: null,
      },
    }),
    prisma.submission.updateMany({
      where: { candidateId },
      data: {
        standardAnswers: {},
        roleAnswers: {},
        psychoAnswers: {},
        cvText: null,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorEmail: session.email,
        action: "CANDIDATE_DATA_ERASED",
        entityType: "CANDIDATE",
        entityId: candidateId,
        jobId: candidate.jobId,
        metadataJson: JSON.stringify({ originalName: candidate.name }),
      },
    }),
  ]);

  logger.info({ actorEmail: session.email, candidateId }, "CANDIDATE_DATA_ERASED");
  revalidatePath(`/admin/candidates/${candidateId}`);
  revalidatePath(`/admin/jobs/${candidate.jobId}`);
  revalidatePath("/admin");
}
