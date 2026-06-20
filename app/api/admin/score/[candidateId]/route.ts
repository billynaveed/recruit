import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { scoreAllStarItems } from "@/lib/scoring/star-scorer";

/**
 * POST /api/admin/score/[candidateId]
 *
 * Triggers LLM rubric scoring for every STAR behavioral item in the candidate's
 * submission. Returns per-item scoring status plus counts. Caching in
 * `star-scorer.ts` means re-requesting this endpoint is cheap as long as the
 * response text is unchanged.
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
    include: { submission: true },
  });

  if (!candidate?.submission) {
    return NextResponse.json({ error: "No submission found" }, { status: 404 });
  }

  const psychoItems = await prisma.psychometricItem.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, itemId: true, itemType: true },
  });

  const psychoAnswers = (candidate.submission.psychoAnswers ?? {}) as Record<
    string,
    string | string[]
  >;

  const results = await scoreAllStarItems(candidate.submission.id, psychoAnswers, psychoItems);

  return NextResponse.json({
    scored: results.filter((r) => r.status === "scored").length,
    failed: results.filter((r) => r.status === "scoring_failed").length,
    insufficient: results.filter((r) => r.status === "insufficient").length,
    results,
  });
}
