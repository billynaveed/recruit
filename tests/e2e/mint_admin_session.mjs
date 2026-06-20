// Mint an admin session cookie for e2e tests. Inserts an AdminSession row
// and prints `cookie=value` so the caller (Python) can set it on a Playwright
// browser context.
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { sealData } from "iron-session";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const email = process.env.ADMIN_E2E_EMAIL ?? "admin@example.com";
const ttlMs = 1000 * 60 * 60; // 1h

const expiresAt = new Date(Date.now() + ttlMs);
const record = await prisma.adminSession.create({
  data: { email, expiresAt },
});

const cookieValue = await sealData(
  { email, sessionId: record.id, expiresAt: expiresAt.getTime() },
  { password: process.env.SESSION_SECRET, ttl: Math.floor(ttlMs / 1000) }
);

console.log(JSON.stringify({
  name: "yfs_recruit_session",
  value: cookieValue,
  sessionId: record.id,
  email,
}));

await prisma.$disconnect();
