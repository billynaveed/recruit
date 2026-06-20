import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ADMIN_HOSTED_DOMAIN as HOSTED_DOMAIN } from "@/lib/admin-domain";
import logger from "@/lib/logger";

export async function POST(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    logger.error("GOOGLE_CLIENT_ID not configured");
    return NextResponse.json({ error: "Google sign-in not configured." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const credential = body?.credential as string | undefined;
  if (!credential) {
    return NextResponse.json({ error: "Missing credential." }, { status: 400 });
  }

  const oauth = new OAuth2Client(clientId);
  let payload;
  try {
    const ticket = await oauth.verifyIdToken({ idToken: credential, audience: clientId });
    payload = ticket.getPayload();
  } catch (err) {
    logger.warn({ err }, "Google ID token verification failed");
    return NextResponse.json({ error: "Invalid Google credential." }, { status: 401 });
  }

  if (!payload?.email || !payload.email_verified) {
    return NextResponse.json({ error: "Email not verified by Google." }, { status: 401 });
  }

  if (payload.hd !== HOSTED_DOMAIN) {
    logger.warn({ email: payload.email, hd: payload.hd }, "Google sign-in rejected: wrong hosted domain");
    return NextResponse.json(
      { error: `Sign in with your ${HOSTED_DOMAIN} account.` },
      { status: 403 }
    );
  }

  const emailLower = payload.email.toLowerCase();
  if (!emailLower.endsWith(`@${HOSTED_DOMAIN}`)) {
    // Defence-in-depth: hd claim should already have caught this.
    logger.warn({ email: emailLower }, "Google sign-in rejected: email domain mismatch");
    return NextResponse.json(
      { error: `Sign in with your ${HOSTED_DOMAIN} account.` },
      { status: 403 }
    );
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const record = await prisma.adminSession.create({
    data: { email: emailLower, expiresAt },
  });

  const session = await getSession();
  session.email = emailLower;
  session.sessionId = record.id;
  session.expiresAt = expiresAt.getTime();
  await session.save();

  logger.info({ email: emailLower, sessionId: record.id }, "Admin login success (google)");

  return NextResponse.json({ ok: true });
}
