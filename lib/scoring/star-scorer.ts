import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { RUBRICS } from "./rubrics";
import { assignBand } from "./band-rules";

/**
 * LLM-based STAR item scorer. The flow is:
 *   1. If the response is below rubric.minLength, store an `insufficient` result.
 *   2. Check cache keyed by (submissionId, itemId, rubricVersion, responseHash).
 *   3. Build prompt from DB template + rubric features.
 *   4. Call Anthropic. Parse JSON. Validate feature values against the rubric.
 *   5. Map features → band via `assignBand`.
 *   6. Persist an ItemScore row (scored / scoring_failed / insufficient).
 *
 * On any error (network, auth, invalid JSON, invalid feature value) we mark the
 * item as `scoring_failed`. We never retry, never fake scores, never silently
 * swallow the error.
 */

const MODEL_ID = "claude-sonnet-4-6";
const ANTHROPIC_TIMEOUT_MS = 30_000;
const ANTHROPIC_MAX_TOKENS = 1024;

// Lazy-initialize so process.env is read at request time (after Next.js loads .env)
let _anthropic: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: ANTHROPIC_TIMEOUT_MS,
    });
  }
  return _anthropic;
}

export type FeatureExtraction = {
  value: string;
  justification: string;
  supporting_excerpt: string;
};

export type ScoringResult = {
  itemId: string;
  status: "scored" | "scoring_failed" | "insufficient";
  band?: string;
  features?: Record<string, FeatureExtraction>;
  rulesFired?: string[];
  error?: string;
};

type PsychometricItemLite = {
  id: string;
  itemId: string;
  itemType: string;
};

function hashResponse(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function persistInsufficient(
  submissionId: string,
  itemId: string,
  rubricVersion: string
): Promise<void> {
  await prisma.itemScore.upsert({
    where: {
      submissionId_itemId_rubricVersion_responseHash: {
        submissionId,
        itemId,
        rubricVersion,
        responseHash: "short",
      },
    },
    create: {
      submissionId,
      itemId,
      rubricVersion,
      modelUsed: "none",
      responseHash: "short",
      features: {},
      bandEstimate: "insufficient_signal",
      rulesFired: ["response_below_minimum_length"],
      rawLlmResponse: "",
      status: "insufficient",
    },
    update: {
      bandEstimate: "insufficient_signal",
      status: "insufficient",
      rulesFired: ["response_below_minimum_length"],
    },
  });
}

async function persistFailure(
  submissionId: string,
  itemId: string,
  rubricVersion: string,
  responseHash: string,
  rawResponse: string
): Promise<void> {
  await prisma.itemScore
    .upsert({
      where: {
        submissionId_itemId_rubricVersion_responseHash: {
          submissionId,
          itemId,
          rubricVersion,
          responseHash,
        },
      },
      create: {
        submissionId,
        itemId,
        rubricVersion,
        modelUsed: MODEL_ID,
        responseHash,
        features: {},
        bandEstimate: "scoring_failed",
        rulesFired: [],
        rawLlmResponse: rawResponse,
        status: "scoring_failed",
      },
      update: {
        bandEstimate: "scoring_failed",
        status: "scoring_failed",
        rawLlmResponse: rawResponse,
      },
    })
    .catch(() => {
      // Swallowing here is intentional: the only purpose of this write is
      // to surface the failure in the UI. If even the error row cannot be
      // written we still return scoring_failed from the outer function.
    });
}

export async function scoreOpenEndedItem(
  submissionId: string,
  itemId: string,
  responseText: string
): Promise<ScoringResult> {
  const rubric = RUBRICS[itemId];
  if (!rubric) {
    return { itemId, status: "scoring_failed", error: `No rubric defined for ${itemId}` };
  }

  if (responseText.trim().length < rubric.minLength) {
    await persistInsufficient(submissionId, itemId, rubric.rubricVersion);
    return { itemId, status: "insufficient", band: "insufficient_signal" };
  }

  const responseHash = hashResponse(responseText);

  const cached = await prisma.itemScore.findUnique({
    where: {
      submissionId_itemId_rubricVersion_responseHash: {
        submissionId,
        itemId,
        rubricVersion: rubric.rubricVersion,
        responseHash,
      },
    },
  });
  if (cached && cached.status !== "scoring_failed") {
    return {
      itemId,
      status: cached.status as "scored" | "insufficient",
      band: cached.bandEstimate,
      features: cached.features as Record<string, FeatureExtraction>,
      rulesFired: cached.rulesFired as string[],
    };
  }

  const template = await prisma.promptTemplate.findUnique({ where: { key: "star_scoring" } });
  const promptBody = template?.body ?? "";

  const rubricFeaturesText = rubric.features
    .map(
      (f) =>
        `Feature: ${f.name}\nAllowed values: ${f.allowedValues.join(", ")}\nEvaluation criterion: ${f.extractionPrompt}`
    )
    .join("\n\n");

  const prompt = promptBody
    .replace("{{item_prompt}}", rubric.itemId)
    .replace("{{response_text}}", responseText)
    .replace("{{rubric_features}}", rubricFeaturesText);

  let rawResponse = "";
  try {
    const message = await getClient().messages.create({
      model: MODEL_ID,
      max_tokens: ANTHROPIC_MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
    });

    rawResponse = message.content[0]?.type === "text" ? message.content[0].text : "";

    const parsed = JSON.parse(rawResponse.trim()) as {
      features?: Record<string, { value?: unknown; justification?: unknown; supporting_excerpt?: unknown }>;
    };

    if (!parsed.features || typeof parsed.features !== "object") {
      throw new Error("Missing features in LLM response");
    }

    const features: Record<string, FeatureExtraction> = {};
    for (const f of rubric.features) {
      const result = parsed.features[f.name];
      if (!result) continue;
      const val = String(result.value ?? "").toLowerCase().trim();
      if (!f.allowedValues.includes(val) && val !== "insufficient") {
        throw new Error(`Invalid value "${val}" for feature ${f.name}`);
      }
      features[f.name] = {
        value: val,
        justification: String(result.justification ?? ""),
        supporting_excerpt: String(result.supporting_excerpt ?? ""),
      };
    }

    const featureValues: Record<string, string> = Object.fromEntries(
      Object.entries(features).map(([k, v]) => [k, v.value])
    );
    const { band, rulesFired } = assignBand(itemId, featureValues);

    await prisma.itemScore.upsert({
      where: {
        submissionId_itemId_rubricVersion_responseHash: {
          submissionId,
          itemId,
          rubricVersion: rubric.rubricVersion,
          responseHash,
        },
      },
      create: {
        submissionId,
        itemId,
        rubricVersion: rubric.rubricVersion,
        modelUsed: MODEL_ID,
        responseHash,
        features,
        bandEstimate: band,
        rulesFired,
        rawLlmResponse: rawResponse,
        status: "scored",
      },
      update: {
        features,
        bandEstimate: band,
        rulesFired,
        rawLlmResponse: rawResponse,
        status: "scored",
        scoredAt: new Date(),
      },
    });

    return { itemId, status: "scored", band, features, rulesFired };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await persistFailure(
      submissionId,
      itemId,
      rubric.rubricVersion,
      responseHash || "unknown",
      rawResponse
    );
    return { itemId, status: "scoring_failed", error: errorMsg };
  }
}

export async function scoreAllStarItems(
  submissionId: string,
  psychoAnswers: Record<string, string | string[]>,
  psychoItems: PsychometricItemLite[]
): Promise<ScoringResult[]> {
  const starItems = psychoItems.filter((p) => p.itemType === "star_behavioral");
  const results: ScoringResult[] = [];

  for (const item of starItems) {
    if (!RUBRICS[item.itemId]) continue;
    const raw = psychoAnswers[item.id];
    const responseText = typeof raw === "string" ? raw : undefined;
    if (!responseText) {
      results.push({ itemId: item.itemId, status: "insufficient", band: "insufficient_signal" });
      continue;
    }
    const result = await scoreOpenEndedItem(submissionId, item.itemId, responseText);
    results.push(result);
  }

  return results;
}
