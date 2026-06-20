import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { runDeterministicSynthesis, SynthesisResult } from "@/lib/scoring/synthesis";
import { generateAllProse } from "@/lib/scoring/synthesis-prose";

/**
 * POST /api/admin/synthesize/[candidateId]
 *
 * Computes full Phase 1 synthesis for a candidate:
 *   1. Deterministic dimension bands, pattern flags, role-fit read (cheap)
 *   2. LLM prose: dimension summaries, rationale, strengths, open questions
 *   3. Stores result in submission.synthesisJson
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { candidateId } = await params;

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      job: {
        include: { roleQuestions: { orderBy: { sortOrder: "asc" } } },
      },
      submission: {
        include: { itemScores: { orderBy: { scoredAt: "desc" } } },
      },
    },
  });

  if (!candidate?.submission) {
    return NextResponse.json({ error: "No submission found" }, { status: 404 });
  }

  const psychoItems = await prisma.psychometricItem.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, itemId: true, itemType: true, body: true, options: true },
  });

  const sub = candidate.submission;
  const psychoScores = (sub.psychoScores as {
    fcTallies?: Record<string, number>;
    t2Scores?: Record<string, number>;
    t1Ranking?: string[];
    ccValues?: Record<string, number>;
  }) ?? {};
  const psychoAnswers = (sub.psychoAnswers ?? {}) as Record<string, string | string[]>;
  const roleAnswers = (sub.roleAnswers ?? {}) as Record<string, string>;

  // De-duplicate item scores: prefer most recent scored over scoring_failed
  const itemScoreMap = new Map<string, (typeof sub.itemScores)[number]>();
  for (const s of sub.itemScores) {
    const existing = itemScoreMap.get(s.itemId);
    if (!existing || (s.status === "scored" && existing.status !== "scored")) {
      itemScoreMap.set(s.itemId, s);
    }
  }
  const dedupedScores = [...itemScoreMap.values()].map((s) => ({
    itemId: s.itemId,
    bandEstimate: s.bandEstimate,
    status: s.status,
    features: s.features as Record<string, { value: string; justification?: string; supporting_excerpt?: string }> | null,
  }));

  // Find the raw T2 choice from psychoAnswers
  const t2Item = psychoItems.find((p) => p.itemId === "C-T2");
  const t2RawChoice = t2Item ? ((psychoAnswers[t2Item.id] as string | undefined) ?? null) : null;

  // ── Step 1: Deterministic synthesis ──────────────────────────────────────
  const deterministic = runDeterministicSynthesis(
    dedupedScores,
    psychoScores,
    candidate.job.title,
    roleAnswers,
    t2RawChoice
  );

  // ── Step 2: LLM prose generation ─────────────────────────────────────────
  const prose = await generateAllProse(
    deterministic,
    dedupedScores,
    psychoAnswers,
    psychoItems.map((p) => ({ id: p.id, itemId: p.itemId, itemType: p.itemType, body: p.body })),
    candidate.job.title,
    undefined,
    roleAnswers
  );

  const synthesis: SynthesisResult = {
    ...deterministic,
    prose,
    computedAt: new Date().toISOString(),
  };

  // ── Step 3: Persist ──────────────────────────────────────────────────────
  await prisma.submission.update({
    where: { candidateId },
    data: { synthesisJson: synthesis as unknown as import("@prisma/client").Prisma.JsonObject },
  });

  return NextResponse.json({ ok: true, roleFitBand: synthesis.roleFitRead.band, flagCount: synthesis.flags.length });
}
