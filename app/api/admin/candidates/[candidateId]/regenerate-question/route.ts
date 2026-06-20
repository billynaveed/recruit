import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { generateOneFollowUp } from "@/lib/scoring/synthesis-prose";
import type { SynthesisResult, PatternFlag } from "@/lib/scoring/synthesis";

/**
 * POST /api/admin/candidates/[candidateId]/regenerate-question
 *
 * Regenerates a single follow-up question for a given flag or dimension.
 * Updates synthesisJson.prose.followUpQuestions and topThree in place.
 *
 * Body: { targetId: string, surface: "flag" | "dimension" }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { candidateId } = await params;
  const body = await req.json().catch(() => ({})) as { targetId?: string; surface?: "flag" | "dimension" };
  const { targetId, surface } = body;

  if (!targetId || !surface) {
    return NextResponse.json({ error: "Missing targetId or surface" }, { status: 400 });
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      job: true,
      submission: { include: { itemScores: { orderBy: { scoredAt: "desc" } } } },
    },
  });

  if (!candidate?.submission) {
    return NextResponse.json({ error: "No submission" }, { status: 404 });
  }

  const psychoItems = await prisma.psychometricItem.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, itemId: true, itemType: true, body: true },
  });

  const sub = candidate.submission;
  const synthesis = sub.synthesisJson as SynthesisResult | null;
  if (!synthesis) {
    return NextResponse.json({ error: "No synthesis found" }, { status: 404 });
  }

  const psychoAnswers = (sub.psychoAnswers ?? {}) as Record<string, string | string[]>;
  const roleAnswers = (sub.roleAnswers ?? {}) as Record<string, string>;

  const itemScoreMap = new Map<string, (typeof sub.itemScores)[number]>();
  for (const s of sub.itemScores) {
    const existing = itemScoreMap.get(s.itemId);
    if (!existing || (s.status === "scored" && existing.status !== "scored")) {
      itemScoreMap.set(s.itemId, s);
    }
  }

  // Build candidate tokens for genericness check
  const allTexts = [
    ...Object.values(roleAnswers),
    ...psychoItems
      .filter((p) => p.itemType === "star_behavioral")
      .map((p) => {
        const ans = psychoAnswers[p.id];
        return typeof ans === "string" ? ans : "";
      }),
  ];
  const tokens = new Set<string>();
  for (const t of allTexts) {
    for (const w of t.toLowerCase().split(/\W+/)) {
      if (w.length >= 4) tokens.add(w);
    }
  }

  let question = "";

  if (surface === "flag") {
    const flag = synthesis.flags.find((f: PatternFlag) => f.id === targetId);
    if (!flag) return NextResponse.json({ error: "Flag not found" }, { status: 404 });

    const relevantResponses: Array<{ sectionLabel: string; excerpt: string; rubricFeatures?: string }> = [];
    for (const ci of flag.contributingItems) {
      const psychoItem = psychoItems.find((p) => p.itemId === ci.itemId);
      if (psychoItem) {
        const ans = psychoAnswers[psychoItem.id];
        const ansText = typeof ans === "string" ? ans : "";
        const score = [...itemScoreMap.values()].find((s) => s.itemId === ci.itemId && s.status === "scored");
        const rubricFeatures = score?.features
          ? Object.entries(score.features as Record<string, { value: string }>)
              .slice(0, 3)
              .map(([k, v]) => `${k}: ${v.value}`)
              .join(", ")
          : undefined;
        const words = ansText.trim().split(/\s+/);
        relevantResponses.push({
          sectionLabel: ci.sectionLabel,
          excerpt: words.length <= 120 ? ansText.trim() : words.slice(0, 120).join(" ") + "…",
          rubricFeatures,
        });
      } else if (ci.itemId === "ROLE_Q") {
        const combined = Object.values(roleAnswers).join(" ");
        const words = combined.trim().split(/\s+/);
        relevantResponses.push({
          sectionLabel: ci.sectionLabel,
          excerpt: words.length <= 120 ? combined.trim() : words.slice(0, 120).join(" ") + "…",
        });
      } else {
        relevantResponses.push({ sectionLabel: ci.sectionLabel, excerpt: ci.excerpt });
      }
    }

    question = await generateOneFollowUp({
      surface: "flag",
      targetId,
      label: flag.label,
      whyItMatters: flag.description.split(".")[0] ?? flag.description,
      relevantResponses,
      roleTitle: candidate.job.title,
      candidateTokens: tokens,
    });
  } else {
    const dimResult = synthesis.dimensions[targetId];
    if (!dimResult) return NextResponse.json({ error: "Dimension not found" }, { status: 404 });

    const { band } = dimResult;
    const whyItMatters =
      band === "concern"
        ? "Multiple signals converge on a concern — probe to understand the pattern."
        : band === "mixed"
        ? "Evidence is mixed — behavioural and forced-choice signals point in different directions."
        : band === "moderate_positive"
        ? "Positive signal but with limited depth — probe to confirm the pattern holds."
        : "Limited signal — not enough evidence to read this dimension confidently.";

    question = await generateOneFollowUp({
      surface: "dimension",
      targetId,
      label: targetId,
      whyItMatters,
      relevantResponses: [],
      roleTitle: candidate.job.title,
      candidateTokens: tokens,
    });
  }

  if (!question) {
    return NextResponse.json({ error: "Could not generate a valid question after retries" }, { status: 422 });
  }

  // Update synthesisJson in place
  const updatedSynthesis: SynthesisResult = {
    ...synthesis,
    prose: {
      ...synthesis.prose!,
      followUpQuestions: {
        byFlag: { ...(synthesis.prose?.followUpQuestions?.byFlag ?? {}) },
        byDimension: { ...(synthesis.prose?.followUpQuestions?.byDimension ?? {}) },
        topThree: synthesis.prose?.followUpQuestions?.topThree ?? [],
      },
    },
  };

  if (surface === "flag") {
    updatedSynthesis.prose!.followUpQuestions!.byFlag[targetId] = question;
  } else {
    updatedSynthesis.prose!.followUpQuestions!.byDimension[targetId] = question;
  }

  // Rebuild topThree with the updated question
  const allRanked: Array<{ q: string; priority: number }> = [];
  for (const flag of synthesis.flags) {
    const q = updatedSynthesis.prose!.followUpQuestions!.byFlag[flag.id];
    if (q) {
      allRanked.push({ q, priority: flag.severity === "high" ? 1 : 4 });
    }
  }
  const priorityDims = /ceo|chief executive/i.test(candidate.job.title)
    ? ["honesty_humility", "conscientiousness", "composure"]
    : /marketing engineer/i.test(candidate.job.title)
    ? ["learning", "conscientiousness", "honesty_humility"]
    : ["conscientiousness", "honesty_humility", "composure", "learning"];

  for (const dim of priorityDims) {
    const q = updatedSynthesis.prose!.followUpQuestions!.byDimension[dim];
    if (!q) continue;
    const band = synthesis.dimensions[dim]?.band;
    const priority =
      band === "concern" || band === "mixed" ? 2 :
      band === "limited_signal" || band === "insufficient_signal" ? 3 : 5;
    allRanked.push({ q, priority });
  }
  allRanked.sort((a, b) => a.priority - b.priority);
  updatedSynthesis.prose!.followUpQuestions!.topThree = allRanked.slice(0, 3).map((r) => r.q);

  await prisma.submission.update({
    where: { candidateId },
    data: { synthesisJson: updatedSynthesis as unknown as import("@prisma/client").Prisma.JsonObject },
  });

  return NextResponse.json({ ok: true, question });
}
