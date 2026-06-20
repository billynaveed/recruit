"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import logger from "@/lib/logger";

/**
 * Update a prompt template body. Always bumps the version counter so the
 * template's audit trail is preserved in the `version` column.
 */
export async function updatePromptTemplateAction(formData: FormData): Promise<void> {
  const session = await requireAuth();

  const key = formData.get("key");
  const body = formData.get("body");
  if (typeof key !== "string" || typeof body !== "string" || !key || !body) {
    return;
  }

  await prisma.promptTemplate.upsert({
    where: { key },
    create: { key, body, updatedBy: session.email },
    update: { body, version: { increment: 1 }, updatedBy: session.email },
  });

  logger.info({ key, updatedBy: session.email }, "Prompt template updated");
  revalidatePath("/admin/settings");
}
