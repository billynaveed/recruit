import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { ADMIN_HOSTED_DOMAIN, isWorkspaceEmail } from "./admin-domain";

export { ADMIN_HOSTED_DOMAIN, isWorkspaceEmail };

export interface SessionData {
  email: string;
  sessionId: string;
  expiresAt: number;
}

function getSessionOptions(): SessionOptions {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters");
  }
  return {
    cookieName: "yfs_recruit_session",
    password: secret,
    ttl: 60 * 60 * 24 * 7,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      path: "/",
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

/**
 * Returns the list of emails to surface in reviewer pickers: every distinct
 * email that has logged in at least once, plus any explicit additions from
 * the optional ADMIN_EMAILS env var (kept for bootstrapping a fresh deploy).
 */
export async function getKnownAdminEmails(): Promise<string[]> {
  const { prisma } = await import("./prisma");
  const rows = await prisma.adminSession.findMany({
    distinct: ["email"],
    select: { email: true },
    orderBy: { email: "asc" },
  });
  const fromDb = rows.map((r) => r.email.toLowerCase()).filter(isWorkspaceEmail);

  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e && isWorkspaceEmail(e));

  return Array.from(new Set([...fromDb, ...fromEnv])).sort();
}
