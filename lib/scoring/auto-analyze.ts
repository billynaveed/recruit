import { prisma } from "@/lib/prisma";
import { scoreAllStarItems } from "./star-scorer";
import { runDeterministicSynthesis, SynthesisResult } from "./synthesis";
import { generateAllProse } from "./synthesis-prose";

/**
 * Runs the full scoring + synthesis pipeline for a candidate without requiring
 * an authenticated HTTP request. Called server-side after application submission
 * via Next.js `after()` so the candidate doesn't wait for it.
 */
export async function autoAnalyzeCandidate(candidateId: string): Promise<void> {
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

  if (!candidate?.submission) return;

  const sub = candidate.submission;
  const psychoAnswers = (sub.psychoAnswers ?? {}) as Record<string, string | string[]>;

  const psychoItems = await prisma.psychometricItem.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, itemId: true, itemType: true, body: true, options: true },
  });

  // ── Step 1: Score STAR items ─────────────────────────────────────────────
  await scoreAllStarItems(sub.id, psychoAnswers, psychoItems);

  // ── Step 2: Re-fetch submission with fresh item scores ───────────────────
  const freshSub = await prisma.submission.findUnique({
    where: { id: sub.id },
    include: { itemScores: { orderBy: { scoredAt: "desc" } } },
  });

  if (!freshSub) return;

  const psychoScores = (freshSub.psychoScores as {
    fcTallies?: Record<string, number>;
    t2Scores?: Record<string, number>;
    t1Ranking?: string[];
    ccValues?: Record<string, number>;
  }) ?? {};
  const roleAnswers = (freshSub.roleAnswers ?? {}) as Record<string, string>;

  // De-duplicate item scores
  const itemScoreMap = new Map<string, (typeof freshSub.itemScores)[number]>();
  for (const s of freshSub.itemScores) {
    const existing = itemScoreMap.get(s.itemId);
    if (!existing || (s.status === "scored" && existing.status !== "scored")) {
      itemScoreMap.set(s.itemId, s);
    }
  }
  const dedupedScores = [...itemScoreMap.values()].map((s) => ({
    itemId: s.itemId,
    bandEstimate: s.bandEstimate,
    status: s.status,
    features: s.features as Record<
      string,
      { value: string; justification?: string; supporting_excerpt?: string }
    > | null,
  }));

  const t2Item = psychoItems.find((p) => p.itemId === "C-T2");
  const t2RawChoice = t2Item
    ? ((psychoAnswers[t2Item.id] as string | undefined) ?? null)
    : null;

  // ── Step 3: Deterministic synthesis ─────────────────────────────────────
  const deterministic = runDeterministicSynthesis(
    dedupedScores,
    psychoScores,
    candidate.job.title,
    roleAnswers,
    t2RawChoice
  );

  // ── Step 4: LLM prose ───────────────────────────────────────────────────
  const prose = await generateAllProse(
    deterministic,
    dedupedScores,
    psychoAnswers,
    psychoItems.map((p) => ({
      id: p.id,
      itemId: p.itemId,
      itemType: p.itemType,
      body: p.body,
    })),
    candidate.job.title,
    undefined,
    roleAnswers
  );

  const synthesis: SynthesisResult = {
    ...deterministic,
    prose,
    computedAt: new Date().toISOString(),
  };

  // ── Step 5: Persist ──────────────────────────────────────────────────────
  await prisma.submission.update({
    where: { id: sub.id },
    data: {
      synthesisJson: synthesis as unknown as import("@prisma/client").Prisma.JsonObject,
    },
  });
}
