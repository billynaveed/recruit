// Test fixture creator for the candidate-flow E2E suite.
// Creates a job + invite via Prisma directly, prints JSON to stdout:
//   { jobId, inviteId, token, candidateEmail, applyUrl }
//
// Usage:
//   DATABASE_URL=... node tests/e2e/setup_fixture.mjs

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes } from "node:crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function token() {
  return randomBytes(24).toString("base64url");
}

async function main() {
  const ts = Date.now();
  const slug = `e2e-flow-${ts}`;
  const title = `E2E Flow Job ${ts}`;
  const candidateEmail = `flow.${ts}@example.com`;
  const candidateName = `Flow Test ${ts}`;

  const job = await prisma.job.create({
    data: {
      title,
      slug,
      department: "Engineering",
      location: "Remote",
      status: "OPEN",
      descriptionText:
        "Senior engineer role. Strong Python and Go skills required, 5+ years experience. " +
        "You will lead architecture, mentor juniors, and ship reliable production systems.",
      descriptionSource: "PASTED_TEXT",
      createdByEmail: "e2e@example.com",
    },
  });

  // Add a single role question so stage 3 has something to render
  await prisma.jobRoleQuestion.create({
    data: {
      jobId: job.id,
      prompt: "Describe a major engineering decision you led and the tradeoffs you weighed.",
      wordLimit: 250,
      sortOrder: 0,
      source: "MANUAL",
    },
  });

  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const invite = await prisma.invite.create({
    data: {
      jobId: job.id,
      candidateName,
      candidateEmail,
      token: token(),
      expiresAt,
      createdByEmail: "e2e@example.com",
    },
  });

  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
  console.log(
    JSON.stringify({
      jobId: job.id,
      inviteId: invite.id,
      token: invite.token,
      candidateEmail,
      applyUrl: `${baseUrl}/apply/${invite.token}`,
    })
  );

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
