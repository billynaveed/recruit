// One-off: re-extract text from CVs that were uploaded before
// 2026-05-04, when extraction was added. Idempotent — only updates
// rows where cvText is null OR cvExtractError is set, and skips files
// that are missing on disk.
//
// Usage:
//   set -a && source .env && set +a
//   node scripts/backfill-cv-text.mjs            # dry run by default
//   node scripts/backfill-cv-text.mjs --apply    # actually write to DB

import path from "node:path";
import fs from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { extractCvText } from "../lib/cv-extract.ts";

const APPLY = process.argv.includes("--apply");
const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "/var/recruit/uploads";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function summarize(text) {
  if (!text) return "(empty)";
  return text.replace(/\s+/g, " ").slice(0, 100);
}

async function main() {
  const targets = await prisma.submission.findMany({
    where: {
      cvPath: { not: null },
      OR: [{ cvText: null }, { cvExtractError: { not: null } }],
    },
    select: {
      id: true,
      candidateId: true,
      cvPath: true,
      cvText: true,
      cvExtractError: true,
      candidate: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${targets.length} submission(s) needing extraction`);
  console.log(`Mode: ${APPLY ? "APPLY (will update DB)" : "DRY RUN (no DB writes)"}`);
  console.log();

  let extracted = 0;
  let missing = 0;
  let failed = 0;

  for (const sub of targets) {
    const abs = path.join(UPLOADS_DIR, sub.cvPath);
    const exists = await fs.access(abs).then(() => true).catch(() => false);
    if (!exists) {
      console.log(`  MISSING  ${sub.candidate?.name ?? "(unknown)"}  ${sub.cvPath}`);
      missing++;
      continue;
    }

    const result = await extractCvText(abs);
    if (result.error) {
      console.log(`  FAILED   ${sub.candidate?.name}  -> ${result.error.slice(0, 120)}`);
      failed++;
      if (APPLY) {
        await prisma.submission.update({
          where: { id: sub.id },
          data: { cvExtractError: result.error, cvExtractedAt: null },
        });
      }
      continue;
    }

    console.log(
      `  OK       ${sub.candidate?.name}  (${result.text.length} chars)  -> ${summarize(result.text)}`
    );
    extracted++;
    if (APPLY) {
      await prisma.submission.update({
        where: { id: sub.id },
        data: {
          cvText: result.text,
          cvExtractedAt: new Date(),
          cvExtractError: null,
        },
      });
    }
  }

  console.log();
  console.log(`Summary: ${extracted} extracted, ${missing} missing on disk, ${failed} failed`);
  if (!APPLY && extracted > 0) {
    console.log(`Re-run with --apply to write the ${extracted} extraction(s) to the DB.`);
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
