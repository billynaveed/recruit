"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { addDays, bulkInviteRegistrationSchema, generateInviteToken } from "@/lib/jobs";
import logger from "@/lib/logger";

export async function registerFromBulkLinkAction(formData: FormData) {
  const bulkToken = String(formData.get("bulkToken") ?? "");
  if (!bulkToken) redirect("/");

  const parsed = bulkInviteRegistrationSchema.safeParse({
    candidateName: formData.get("candidateName"),
    candidateEmail: formData.get("candidateEmail"),
  });

  if (!parsed.success) {
    const params = new URLSearchParams();
    params.set("error", "validation");
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    if (first) params.set("message", first);
    redirect(`/apply/bulk/${bulkToken}?${params.toString()}`);
  }

  const link = await prisma.bulkInviteLink.findUnique({
    where: { token: bulkToken },
  });

  if (!link || link.status !== "ACTIVE" || link.expiresAt < new Date()) {
    redirect(`/apply/bulk/${bulkToken}/expired`);
  }

  const email = parsed.data.candidateEmail.toLowerCase();

  const existingInvite = await prisma.invite.findFirst({
    where: {
      bulkInviteLinkId: link.id,
      candidateEmail: email,
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingInvite) {
    redirect(`/apply/${existingInvite.token}`);
  }

  const invite = await prisma.invite.create({
    data: {
      jobId: link.jobId,
      candidateName: parsed.data.candidateName,
      candidateEmail: email,
      token: generateInviteToken(),
      expiresAt: addDays(Math.max(1, Math.ceil((link.expiresAt.getTime() - Date.now()) / 86_400_000))),
      bulkInviteLinkId: link.id,
      createdByEmail: link.createdByEmail,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorEmail: link.createdByEmail,
      action: "BULK_INVITE_REGISTRATION",
      entityType: "INVITE",
      entityId: invite.id,
      jobId: link.jobId,
      inviteId: invite.id,
      metadataJson: JSON.stringify({
        bulkInviteLinkId: link.id,
        candidateEmail: email,
      }),
    },
  });

  logger.info(
    { bulkInviteLinkId: link.id, inviteId: invite.id, jobId: link.jobId },
    "Candidate self-registered from bulk invite link"
  );

  revalidatePath(`/admin/jobs/${link.jobId}`);
  redirect(`/apply/${invite.token}`);
}
