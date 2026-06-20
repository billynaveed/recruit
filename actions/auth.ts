"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import logger from "@/lib/logger";

export async function logoutAction(): Promise<void> {
  const session = await getSession();

  if (session.sessionId) {
    await prisma.adminSession
      .delete({ where: { id: session.sessionId } })
      .catch(() => {});

    logger.info({ email: session.email, sessionId: session.sessionId }, "Admin logout");
  }

  session.destroy();
  redirect("/login");
}
