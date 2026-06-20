"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import logger from "@/lib/logger";
import {
  addDays,
  createBulkInviteLinkSchema,
  createInviteSchema,
  createJobSchema,
  generateInviteToken,
  generateRoleQuestionsFromDescription,
  parseCsvInvites,
  roleQuestionSchema,
  uniqueJobSlug,
} from "@/lib/jobs";
import { InviteStatus, JobStatus } from "@prisma/client";

type ActionState = {
  success?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createJobAction(formData: FormData): Promise<void> {
  await createJobActionState({}, formData);
}

export async function createJobActionState(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAuth();

  const parsed = createJobSchema.safeParse({
    title: formData.get("title"),
    department: formData.get("department"),
    location: formData.get("location"),
    employmentType: formData.get("employmentType"),
    status: formData.get("status"),
    descriptionText: formData.get("descriptionText"),
    descriptionFileName: formData.get("descriptionFileName"),
    customQuestionPrompt: formData.get("customQuestionPrompt"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const generated = await generateRoleQuestionsFromDescription({
    title: parsed.data.title,
    descriptionText: parsed.data.descriptionText,
    customPrompt: parsed.data.customQuestionPrompt || undefined,
  });

  const job = await prisma.job.create({
    data: {
      title: parsed.data.title,
      slug: uniqueJobSlug(parsed.data.title),
      department: parsed.data.department || null,
      location: parsed.data.location || null,
      employmentType: parsed.data.employmentType || null,
      status: parsed.data.status,
      descriptionSource: parsed.data.descriptionFileName ? "PDF_UPLOAD_REFERENCE" : "PASTED_TEXT",
      descriptionText: parsed.data.descriptionText,
      descriptionFileName: parsed.data.descriptionFileName || null,
      customQuestionPrompt: parsed.data.customQuestionPrompt || null,
      roleQuestionGenerationRaw: JSON.stringify({
        provider: "stub",
        generatedAt: new Date().toISOString(),
        count: generated.length,
      }),
      createdByEmail: session.email,
      roleQuestions: {
        create: generated.map((question, index) => ({
          prompt: question.prompt,
          wordLimit: question.wordLimit,
          sortOrder: index,
          source: question.source,
        })),
      },
      auditLogs: {
        create: {
          actorEmail: session.email,
          action: "JOB_CREATED",
          entityType: "JOB",
          entityId: "pending",
          metadataJson: JSON.stringify({
            status: parsed.data.status,
            generatedQuestionCount: generated.length,
          }),
        },
      },
    },
    include: { auditLogs: true },
  });

  await prisma.auditLog.updateMany({
    where: { jobId: job.id, entityId: "pending", action: "JOB_CREATED" },
    data: { entityId: job.id },
  });

  logger.info({ actorEmail: session.email, jobId: job.id }, "Job created");
  revalidatePath("/admin");
  revalidatePath(`/admin/jobs/${job.id}`);

  return { success: `Created ${job.title}.` };
}

export async function updateRoleQuestionsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAuth();
  const jobId = String(formData.get("jobId") ?? "");

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    return { error: "Job not found." };
  }

  const rawQuestions = String(formData.get("questionsJson") ?? "[]");
  let questions: Array<ReturnType<typeof roleQuestionSchema.parse>>;

  try {
    const parsed = JSON.parse(rawQuestions);
    questions = Array.isArray(parsed)
      ? parsed.map((question, index) =>
          roleQuestionSchema.parse({ ...question, sortOrder: index })
        )
      : [];
  } catch {
    return { error: "Questions payload is invalid." };
  }

  if (questions.length === 0) {
    return { error: "Add at least one role-specific question." };
  }

  await prisma.$transaction([
    prisma.jobRoleQuestion.deleteMany({ where: { jobId } }),
    prisma.jobRoleQuestion.createMany({
      data: questions.map((question, index) => ({
        jobId,
        prompt: question.prompt,
        wordLimit: question.wordLimit,
        sortOrder: index,
        source: question.source,
      })),
    }),
    prisma.auditLog.create({
      data: {
        actorEmail: session.email,
        action: "JOB_ROLE_QUESTIONS_UPDATED",
        entityType: "JOB",
        entityId: jobId,
        jobId,
        metadataJson: JSON.stringify({ questionCount: questions.length }),
      },
    }),
  ]);

  logger.info({ actorEmail: session.email, jobId, questionCount: questions.length }, "Role questions updated");
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin");

  return { success: "Role-specific questions updated." };
}

export async function createInviteAction(formData: FormData): Promise<void> {
  await createInviteActionState({}, formData);
}

export async function createInviteActionState(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAuth();

  const parsed = createInviteSchema.safeParse({
    jobId: formData.get("jobId"),
    candidateName: formData.get("candidateName"),
    candidateEmail: formData.get("candidateEmail"),
    notes: formData.get("notes"),
    expiresInDays: formData.get("expiresInDays"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const job = await prisma.job.findUnique({ where: { id: parsed.data.jobId } });
  if (!job) {
    return { error: "Selected job was not found." };
  }

  const invite = await prisma.invite.create({
    data: {
      jobId: parsed.data.jobId,
      candidateName: parsed.data.candidateName,
      candidateEmail: parsed.data.candidateEmail.toLowerCase(),
      token: generateInviteToken(),
      expiresAt: addDays(parsed.data.expiresInDays),
      notes: parsed.data.notes || null,
      createdByEmail: session.email,
      auditLogs: {
        create: {
          actorEmail: session.email,
          action: "INVITE_CREATED",
          entityType: "INVITE",
          entityId: "pending",
          jobId: parsed.data.jobId,
          metadataJson: JSON.stringify({ candidateEmail: parsed.data.candidateEmail.toLowerCase() }),
        },
      },
    },
  });

  await prisma.auditLog.updateMany({
    where: { inviteId: invite.id, entityId: "pending", action: "INVITE_CREATED" },
    data: { entityId: invite.id },
  });

  logger.info({ actorEmail: session.email, inviteId: invite.id, jobId: job.id }, "Invite created");
  revalidatePath(`/admin/jobs/${job.id}`);
  revalidatePath("/admin");

  return { success: `Invite created for ${invite.candidateName}.` };
}

export async function bulkImportInvitesAction(formData: FormData): Promise<void> {
  await bulkImportInvitesActionState({}, formData);
}

export async function bulkImportInvitesActionState(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAuth();
  const jobId = String(formData.get("jobId") ?? "");
  const csvText = String(formData.get("csvText") ?? "");
  const expiresInDays = Number(formData.get("expiresInDays") ?? 14);

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    return { error: "Selected job was not found." };
  }

  let rows;
  try {
    rows = parseCsvInvites(csvText);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "CSV import failed." };
  }

  if (rows.length === 0) {
    return { error: "CSV did not contain any candidate rows." };
  }

  const expiresAt = addDays(expiresInDays);

  await prisma.$transaction([
    prisma.invite.createMany({
      data: rows.map((row) => ({
        jobId,
        candidateName: row.candidateName,
        candidateEmail: row.candidateEmail.toLowerCase(),
        notes: row.notes || null,
        token: generateInviteToken(),
        expiresAt,
        createdByEmail: session.email,
      })),
    }),
    prisma.auditLog.create({
      data: {
        actorEmail: session.email,
        action: "INVITES_IMPORTED",
        entityType: "JOB",
        entityId: jobId,
        jobId,
        metadataJson: JSON.stringify({ importedCount: rows.length }),
      },
    }),
  ]);

  logger.info({ actorEmail: session.email, jobId, importedCount: rows.length }, "Invites imported from CSV");
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin");

  return { success: `Imported ${rows.length} invite${rows.length === 1 ? "" : "s"}.` };
}

export async function markInviteCopiedAction(inviteId: string, jobId: string): Promise<void> {
  const session = await requireAuth();
  await prisma.$transaction([
    prisma.invite.update({
      where: { id: inviteId },
      data: { lastCopiedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        actorEmail: session.email,
        action: "INVITE_LINK_COPIED",
        entityType: "INVITE",
        entityId: inviteId,
        inviteId,
        jobId,
      },
    }),
  ]);
  logger.info({ actorEmail: session.email, inviteId, jobId }, "Invite link copied");
  revalidatePath(`/admin/jobs/${jobId}`);
}

export async function createBulkInviteLinkAction(formData: FormData): Promise<void> {
  await createBulkInviteLinkActionState({}, formData);
}

export async function createBulkInviteLinkActionState(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAuth();

  const parsed = createBulkInviteLinkSchema.safeParse({
    jobId: formData.get("jobId"),
    label: formData.get("label"),
    expiresInDays: formData.get("expiresInDays"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const job = await prisma.job.findUnique({ where: { id: parsed.data.jobId } });
  if (!job) {
    return { error: "Selected job was not found." };
  }

  const link = await prisma.bulkInviteLink.create({
    data: {
      jobId: parsed.data.jobId,
      label: parsed.data.label || null,
      token: generateInviteToken(),
      expiresAt: addDays(parsed.data.expiresInDays),
      createdByEmail: session.email,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorEmail: session.email,
      action: "BULK_INVITE_LINK_CREATED",
      entityType: "BULK_INVITE_LINK",
      entityId: link.id,
      jobId: parsed.data.jobId,
      metadataJson: JSON.stringify({ label: parsed.data.label || null }),
    },
  });

  logger.info({ actorEmail: session.email, bulkInviteLinkId: link.id, jobId: job.id }, "Bulk invite link created");
  revalidatePath(`/admin/jobs/${job.id}`);

  return { success: "Bulk invite link created." };
}

export async function revokeBulkInviteLinkAction(linkId: string, jobId: string): Promise<void> {
  const session = await requireAuth();

  await prisma.$transaction([
    prisma.bulkInviteLink.update({
      where: { id: linkId },
      data: { status: InviteStatus.REVOKED, revokedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        actorEmail: session.email,
        action: "BULK_INVITE_LINK_REVOKED",
        entityType: "BULK_INVITE_LINK",
        entityId: linkId,
        jobId,
      },
    }),
  ]);

  logger.info({ actorEmail: session.email, bulkInviteLinkId: linkId, jobId }, "Bulk invite link revoked");
  revalidatePath(`/admin/jobs/${jobId}`);
}

export async function updateJobDescriptionAction(
  jobId: string,
  descriptionText: string
): Promise<void> {
  const session = await requireAuth();
  const trimmed = descriptionText.trim();
  if (trimmed.length < 100) return;
  if (trimmed.length > 50000) return;

  await prisma.$transaction([
    prisma.job.update({ where: { id: jobId }, data: { descriptionText: trimmed } }),
    prisma.auditLog.create({
      data: {
        actorEmail: session.email,
        action: "JOB_DESCRIPTION_UPDATED",
        entityType: "JOB",
        entityId: jobId,
        jobId,
        metadataJson: JSON.stringify({ length: trimmed.length }),
      },
    }),
  ]);

  logger.info({ actorEmail: session.email, jobId }, "Job description updated");
  revalidatePath(`/admin/jobs/${jobId}`);
}

export async function deleteJobAction(jobId: string): Promise<void> {
  const session = await requireAuth();

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, title: true },
  });
  if (!job) return;

  // Audit row first; the Job FK cascade would otherwise drop it.
  await prisma.auditLog.create({
    data: {
      actorEmail: session.email,
      action: "JOB_DELETED",
      entityType: "JOB",
      entityId: jobId,
      metadataJson: JSON.stringify({ title: job.title }),
    },
  });

  await prisma.job.delete({ where: { id: jobId } });

  logger.info({ actorEmail: session.email, jobId, title: job.title }, "Job deleted");
  revalidatePath("/admin");
}

export async function setJobStatusAction(
  jobId: string,
  status: JobStatus
): Promise<void> {
  const session = await requireAuth();

  await prisma.$transaction([
    prisma.job.update({ where: { id: jobId }, data: { status } }),
    prisma.auditLog.create({
      data: {
        actorEmail: session.email,
        action: "JOB_STATUS_CHANGED",
        entityType: "JOB",
        entityId: jobId,
        jobId,
        metadataJson: JSON.stringify({ status }),
      },
    }),
  ]);

  logger.info({ actorEmail: session.email, jobId, status }, "Job status changed");
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin");
}

export async function revokeInviteAction(inviteId: string, jobId: string): Promise<void> {
  const session = await requireAuth();

  await prisma.$transaction([
    prisma.invite.update({
      where: { id: inviteId },
      data: { status: InviteStatus.REVOKED, revokedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        actorEmail: session.email,
        action: "INVITE_REVOKED",
        entityType: "INVITE",
        entityId: inviteId,
        inviteId,
        jobId,
      },
    }),
  ]);

  logger.info({ actorEmail: session.email, inviteId, jobId }, "Invite revoked");
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin");
}

export async function extendInviteExpiryAction(
  inviteId: string,
  jobId: string,
  additionalDays: number
): Promise<void> {
  const session = await requireAuth();
  const days = Math.max(1, Math.min(180, Math.floor(additionalDays)));

  const invite = await prisma.invite.findUnique({
    where: { id: inviteId },
    select: { expiresAt: true },
  });
  if (!invite) return;

  const newExpiresAt = new Date(
    Math.max(Date.now(), invite.expiresAt.getTime()) + days * 24 * 60 * 60 * 1000
  );

  await prisma.$transaction([
    prisma.invite.update({
      where: { id: inviteId },
      data: { expiresAt: newExpiresAt, status: InviteStatus.ACTIVE },
    }),
    prisma.auditLog.create({
      data: {
        actorEmail: session.email,
        action: "INVITE_EXPIRY_EXTENDED",
        entityType: "INVITE",
        entityId: inviteId,
        inviteId,
        jobId,
        metadataJson: JSON.stringify({ days, newExpiresAt: newExpiresAt.toISOString() }),
      },
    }),
  ]);

  logger.info({ actorEmail: session.email, inviteId, jobId, days }, "Invite expiry extended");
  revalidatePath(`/admin/jobs/${jobId}`);
}

export async function regenerateInviteTokenAction(
  inviteId: string,
  jobId: string
): Promise<void> {
  const session = await requireAuth();

  await prisma.$transaction([
    prisma.invite.update({
      where: { id: inviteId },
      data: { token: generateInviteToken(), lastCopiedAt: null },
    }),
    prisma.auditLog.create({
      data: {
        actorEmail: session.email,
        action: "INVITE_TOKEN_REGENERATED",
        entityType: "INVITE",
        entityId: inviteId,
        inviteId,
        jobId,
      },
    }),
  ]);

  logger.info({ actorEmail: session.email, inviteId, jobId }, "Invite token regenerated");
  revalidatePath(`/admin/jobs/${jobId}`);
}

export async function deleteInviteAction(
  inviteId: string,
  jobId: string
): Promise<void> {
  const session = await requireAuth();

  // Audit before delete since the invite FK cascades the audit row out otherwise.
  await prisma.auditLog.create({
    data: {
      actorEmail: session.email,
      action: "INVITE_DELETED",
      entityType: "INVITE",
      entityId: inviteId,
      jobId,
    },
  });

  await prisma.invite.delete({ where: { id: inviteId } });

  logger.info({ actorEmail: session.email, inviteId, jobId }, "Invite deleted");
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin");
}
