import { getSession, type SessionData } from "./session";
import { ADMIN_HOSTED_DOMAIN as HOSTED_DOMAIN } from "./admin-domain";
import { redirect } from "next/navigation";

// NOTE: AdminSession DB records are an audit log only — session validity comes
// solely from the iron-session signed cookie. Phase 2: add a DB lookup here to
// support "revoke all sessions". Also needed: a cleanup job to purge expired rows.
export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();

  if (!session.email || !session.sessionId) {
    redirect("/login");
  }

  if (session.expiresAt < Date.now()) {
    session.destroy();
    redirect("/login");
  }

  if (!session.email.toLowerCase().endsWith(`@${HOSTED_DOMAIN}`)) {
    session.destroy();
    redirect("/login");
  }

  return {
    email: session.email,
    sessionId: session.sessionId,
    expiresAt: session.expiresAt,
  };
}
