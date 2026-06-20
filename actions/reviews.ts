"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { isWorkspaceEmail } from "@/lib/session";
import logger from "@/lib/logger";
import { ReviewStatus, ReviewRecommendation } from "@prisma/client";

const RECOMMENDATIONS = new Set<ReviewRecommendation>([
  "STRONG_YES",
  "YES",
  "LEAN_NO",
  "NO",
]);

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function assignReviewerAction(formData: FormData): Promise<void> {
  const session = await requireAuth();
  const candidateId = String(formData.get("candidateId") ?? "");
  const reviewerEmail = normalizeEmail(String(formData.get("reviewerEmail") ?? ""));
  if (!candidateId || !reviewerEmail) return;

  if (!isWorkspaceEmail(reviewerEmail)) return;

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true, jobId: true },
  });
  if (!candidate) return;

  // Avoid duplicate active assignment per reviewer
  const existing = await prisma.review.findFirst({
    where: {
      candidateId,
      reviewerEmail,
      status: { in: [ReviewStatus.PENDING, ReviewStatus.SUBMITTED] },
    },
    select: { id: true },
  });
  if (existing) return;

  const review = await prisma.review.create({
    data: {
      candidateId,
      reviewerEmail,
      assignedByEmail: session.email,
      status: ReviewStatus.PENDING,
    },
    select: { id: true },
  });

  await prisma.auditLog.create({
    data: {
      actorEmail: session.email,
      action: "REVIEW_ASSIGNED",
      entityType: "REVIEW",
      entityId: review.id,
      jobId: candidate.jobId,
      metadataJson: JSON.stringify({ candidateId, reviewerEmail }),
    },
  });

  logger.info({ actorEmail: session.email, candidateId, reviewerEmail, reviewId: review.id }, "REVIEW_ASSIGNED");

  revalidatePath(`/admin/candidates/${candidateId}`);
  revalidatePath("/admin/reviews");
}

export async function submitReviewAction(formData: FormData): Promise<void> {
  const session = await requireAuth();
  const reviewId = String(formData.get("reviewId") ?? "");
  const rec = String(formData.get("recommendation") ?? "") as ReviewRecommendation;
  const notes = String(formData.get("notes") ?? "").trim();
  if (!reviewId || !RECOMMENDATIONS.has(rec)) return;

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      reviewerEmail: true,
      status: true,
      candidateId: true,
      candidate: { select: { jobId: true } },
    },
  });
  if (!review) return;
  if (normalizeEmail(review.reviewerEmail) !== normalizeEmail(session.email)) return;
  if (review.status === ReviewStatus.WITHDRAWN) return;

  await prisma.$transaction([
    prisma.review.update({
      where: { id: reviewId },
      data: {
        status: ReviewStatus.SUBMITTED,
        recommendation: rec,
        notes: notes || null,
        submittedAt: new Date(),
      },
    }),
    prisma.auditLog.create({
      data: {
        actorEmail: session.email,
        action: "REVIEW_SUBMITTED",
        entityType: "REVIEW",
        entityId: reviewId,
        jobId: review.candidate.jobId,
        metadataJson: JSON.stringify({
          candidateId: review.candidateId,
          recommendation: rec,
          previousStatus: review.status,
        }),
      },
    }),
  ]);

  logger.info(
    { actorEmail: session.email, reviewId, candidateId: review.candidateId, recommendation: rec },
    "REVIEW_SUBMITTED"
  );

  revalidatePath(`/admin/candidates/${review.candidateId}`);
  revalidatePath("/admin/reviews");
}

export async function withdrawReviewAction(formData: FormData): Promise<void> {
  const session = await requireAuth();
  const reviewId = String(formData.get("reviewId") ?? "");
  if (!reviewId) return;

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      reviewerEmail: true,
      assignedByEmail: true,
      status: true,
      candidateId: true,
      candidate: { select: { jobId: true } },
    },
  });
  if (!review) return;
  if (review.status === ReviewStatus.WITHDRAWN) return;

  // Reviewer or original assigner can withdraw a pending assignment.
  const actorIsReviewer = normalizeEmail(review.reviewerEmail) === normalizeEmail(session.email);
  const actorIsAssigner = normalizeEmail(review.assignedByEmail) === normalizeEmail(session.email);
  if (!actorIsReviewer && !actorIsAssigner) return;

  await prisma.$transaction([
    prisma.review.update({
      where: { id: reviewId },
      data: {
        status: ReviewStatus.WITHDRAWN,
        withdrawnAt: new Date(),
      },
    }),
    prisma.auditLog.create({
      data: {
        actorEmail: session.email,
        action: "REVIEW_WITHDRAWN",
        entityType: "REVIEW",
        entityId: reviewId,
        jobId: review.candidate.jobId,
        metadataJson: JSON.stringify({
          candidateId: review.candidateId,
          previousStatus: review.status,
        }),
      },
    }),
  ]);

  logger.info(
    { actorEmail: session.email, reviewId, candidateId: review.candidateId },
    "REVIEW_WITHDRAWN"
  );

  revalidatePath(`/admin/candidates/${review.candidateId}`);
  revalidatePath("/admin/reviews");
}
