import { ReviewRecommendation, ReviewStatus, CandidateStage } from "@prisma/client";

type ReviewLite = {
  status: ReviewStatus;
  recommendation: ReviewRecommendation | null;
};

export type ConsensusSummary = {
  total: number;
  counts: Record<ReviewRecommendation, number>;
  headline: string | null;
  leaning: "positive" | "negative" | "split" | null;
};

const RECOMMENDATION_LABEL: Record<ReviewRecommendation, string> = {
  STRONG_YES: "strong yes",
  YES: "yes",
  LEAN_NO: "lean no",
  NO: "no",
};

const POSITIVE: ReviewRecommendation[] = ["STRONG_YES", "YES"];
const NEGATIVE: ReviewRecommendation[] = ["LEAN_NO", "NO"];

export function summarizeConsensus(reviews: ReviewLite[]): ConsensusSummary {
  const submitted = reviews.filter(
    (r) => r.status === ReviewStatus.SUBMITTED && r.recommendation !== null
  );
  const counts: Record<ReviewRecommendation, number> = {
    STRONG_YES: 0,
    YES: 0,
    LEAN_NO: 0,
    NO: 0,
  };
  for (const r of submitted) {
    counts[r.recommendation as ReviewRecommendation]++;
  }
  const total = submitted.length;
  if (total === 0) {
    return { total: 0, counts, headline: null, leaning: null };
  }

  // Build headline like "2 strong yes, 1 lean no" — only non-zero buckets, in fixed severity order
  const order: ReviewRecommendation[] = ["STRONG_YES", "YES", "LEAN_NO", "NO"];
  const parts = order
    .filter((rec) => counts[rec] > 0)
    .map((rec) => `${counts[rec]} ${RECOMMENDATION_LABEL[rec]}`);
  const headline = parts.join(", ");

  const positiveCount = POSITIVE.reduce((sum, rec) => sum + counts[rec], 0);
  const negativeCount = NEGATIVE.reduce((sum, rec) => sum + counts[rec], 0);
  let leaning: ConsensusSummary["leaning"];
  if (positiveCount > 0 && negativeCount === 0) leaning = "positive";
  else if (negativeCount > 0 && positiveCount === 0) leaning = "negative";
  else leaning = "split";

  return { total, counts, headline, leaning };
}

const NEEDS_DECISION_STAGES: CandidateStage[] = [
  CandidateStage.COMPLETED,
  CandidateStage.REVIEWING,
];

/**
 * A candidate "needs decision" when at least one reviewer has submitted but the
 * candidate is still in a pre-decision stage. Once admin shortlists, hires,
 * rejects, or sends to OFFER, the decision is considered made.
 */
export function needsDecision(args: {
  stage: CandidateStage;
  submittedReviewCount: number;
}): boolean {
  return (
    NEEDS_DECISION_STAGES.includes(args.stage) && args.submittedReviewCount > 0
  );
}
