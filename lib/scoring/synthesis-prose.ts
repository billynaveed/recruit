/**
 * Phase 1 prose generation — LLM calls for dimension summaries, role-fit
 * rationale, strengths, and open questions.
 *
 * Uses Anthropic Sonnet (primary). Results are stored in synthesisJson.prose
 * and are content-addressed so they only regenerate when the underlying data changes.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  SynthesisResult,
  DimensionResult,
  DimensionBand,
  RoleFitRead,
  PatternFlag,
  ItemScoreData,
  FollowUpQuestions,
} from "./synthesis";

const MODEL_ID = "claude-sonnet-4-6";
const TIMEOUT_MS = 30_000;
const MAX_TOKENS = 512;

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: TIMEOUT_MS });
  }
  return _client;
}

// ─── Band display strings ─────────────────────────────────────────────────────

const BAND_DISPLAY: Record<DimensionBand, string> = {
  unusually_strong: "unusually strong positive signal",
  strong_positive: "strong positive signal",
  moderate_positive: "moderate positive signal",
  mixed: "mixed signal",
  limited_signal: "limited signal",
  insufficient_signal: "insufficient signal",
  concern: "concern",
};

const CONFIDENCE_DISPLAY: Record<string, string> = {
  rich_signal: "rich — three or more converging sources",
  moderate_signal: "moderate — two sources or partial convergence",
  limited_signal: "limited — one source or weak corroboration",
};

const DIMENSION_DISPLAY: Record<string, string> = {
  conscientiousness: "Conscientiousness — reliability, self-discipline, and goal-directed follow-through",
  honesty_humility: "Honesty-Humility — sincerity, fairness, modesty, and low exploitativeness",
  composure: "Composure — observable behavioural response and recovery under stress or setback",
  learning: "Learning Orientation — openness to disconfirming information and evidence of self-directed updating",
  interpersonal: "Interpersonal Style — patterns in disagreement, feedback, collaboration, and direction-giving",
  motivation: "Motivational Drivers — what the candidate most wants from their work environment",
};

// ─── LLM call helper ─────────────────────────────────────────────────────────

async function callLLM(prompt: string, maxWords: number): Promise<string> {
  try {
    const message = await getClient().messages.create({
      model: MODEL_ID,
      max_tokens: MAX_TOKENS,
      system: `You write precise, evidence-based summaries for hiring managers.
Plain prose only. No bullet points, no headings, no preamble.
No clinical or psychological jargon. No "demonstrates," "showcases," or "exhibits."
No "high in X" or "low in X" framing. No generic HR phrases.
Maximum ${maxWords} words. Return only the requested text.`,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
    return text;
  } catch {
    return "";
  }
}

// ─── Dimension prose (2-3 sentences) ─────────────────────────────────────────

type EvidenceExcerpt = {
  sectionLabel: string;
  responseExcerpt: string;
  rubricFeatures?: string;
};

export async function generateDimensionProse(
  dimension: string,
  result: DimensionResult,
  evidence: EvidenceExcerpt[]
): Promise<string> {
  const evidenceText = evidence
    .map((e) => `- ${e.sectionLabel}: "${e.responseExcerpt}"${e.rubricFeatures ? ` [${e.rubricFeatures}]` : ""}`)
    .join("\n");

  const prompt = `Write a 2-3 sentence summary of this candidate's signal on ${DIMENSION_DISPLAY[dimension] ?? dimension}.

BAND: ${BAND_DISPLAY[result.band] ?? result.band}
CONFIDENCE: ${CONFIDENCE_DISPLAY[result.confidence] ?? result.confidence}
${result.conflictNote ? `CONFLICT NOTE: ${result.conflictNote}` : ""}

EVIDENCE:
${evidenceText || "No specific evidence excerpts available."}

Reference evidence by section label (e.g., "In the recent-work item…"), never by internal ID (not "C-S1").
Cite specific phrases from the candidate's response in quotation marks when available.
If the band is mixed or insufficient, explain what's missing or what conflicts.
2-3 sentences. No bullet points. No preamble.`;

  return callLLM(prompt, 80);
}

// ─── Role-fit rationale (1-2 sentences) ──────────────────────────────────────

export async function generateRoleFitRationale(
  roleTitle: string,
  roleFitRead: RoleFitRead,
  flags: PatternFlag[]
): Promise<string> {
  const dimLines = roleFitRead.priorityDimensionScores
    .map((d) => `- ${d.dimension}: ${BAND_DISPLAY[d.band] ?? d.band}`)
    .join("\n");
  const flagLines = flags.length > 0
    ? flags.map((f) => `- [${f.severity.toUpperCase()}] ${f.label}`).join("\n")
    : "None";

  const prompt = `Write 1-2 sentences interpreting what this candidate's signals mean for this specific role.

ROLE: ${roleTitle}
ROLE-FIT READ: ${roleFitRead.band}

PRIORITY DIMENSION SIGNALS:
${dimLines}

PATTERN FLAGS:
${flagLines}

This is the INTERPRETIVE sentence — explain what the pattern means for fit in this role.
Do NOT describe the candidate as a person. Do NOT recommend hire or no-hire.
Do NOT list the dimensions or flags by name — synthesise them into a single interpretive read.
If positive, name what makes this candidate well-suited. If negative, name what specific concern drives the read.
1-2 sentences only. No preamble.`;

  return callLLM(prompt, 60);
}

// ─── Overall confidence rationale (factual, not interpretive) ─────────────────

export async function generateConfidenceRationale(
  overallConfidence: string,
  overallConfidenceDescription: string,
  scoredItemCount: number,
  failedItemCount: number,
  dimensionBands: Record<string, { band: string; confidence: string }>
): Promise<string> {
  const contributingDims = Object.entries(dimensionBands)
    .filter(([, d]) => d.band !== "insufficient_signal")
    .map(([dim, d]) => `${dim}: ${d.confidence.replace("_", " ")}`)
    .join(", ");

  const failedNote = failedItemCount > 0
    ? `\nNOTE: ${failedItemCount} of the behavioural item(s) could not be scored automatically — mention this as a gap in coverage.`
    : "";

  const prompt = `Write exactly 1 sentence answering: "How much signal do we have, and how consistent is it?"

OVERALL CONFIDENCE: ${overallConfidenceDescription}
BEHAVIOURAL ITEMS SCORED: ${scoredItemCount}${failedItemCount > 0 ? ` (${failedItemCount} item(s) not scored)` : ""}
DIMENSION CONFIDENCE LEVELS: ${contributingDims || "none"}${failedNote}

This sentence is purely factual — it describes evidence quantity and consistency, NOT what the evidence means about the candidate.
Mention how many behavioural items scored and whether dimension signals are converging or mixed.
Examples of the right register:
  "Rich signal — four behavioural items scored with converging evidence; dimension signals align with forced-choice tallies."
  "Rich signal — four behavioural items scored, with multiple items converging on a concerning pattern around transparency and ownership."
  "Moderate signal — two behavioural items scored with partial convergence; one dimension has insufficient data."
Do NOT describe the candidate. Do NOT interpret what signals mean.
One sentence only. No preamble.`;

  return callLLM(prompt, 50);
}

// ─── Strength statements (1 sentence per dimension) ──────────────────────────

export async function generateStrength(
  dimension: string,
  band: DimensionBand,
  evidence: EvidenceExcerpt[]
): Promise<string> {
  const evidenceText = evidence
    .map((e) => `- ${e.sectionLabel}: "${e.responseExcerpt}"`)
    .join("\n");

  const prompt = `Write exactly one sentence describing a candidate strength on ${DIMENSION_DISPLAY[dimension] ?? dimension}.

BAND: ${BAND_DISPLAY[band] ?? band}
KEY EVIDENCE:
${evidenceText || "Forced-choice data shows strong preference."}

Reference the item by section label. Use a specific phrase from the response if available.
Do NOT say the candidate is "high in X". Describe what they said or did.
One sentence only. No preamble.`;

  return callLLM(prompt, 35);
}

// ─── Open questions (1 sentence per insufficient-signal priority dimension) ────

export async function generateOpenQuestion(
  dimension: string,
  whyInsufficient: string
): Promise<string> {
  const prompt = `Write one open question for a hiring manager about a dimension with insufficient signal.

DIMENSION: ${DIMENSION_DISPLAY[dimension] ?? dimension}
WHY INSUFFICIENT: ${whyInsufficient}

Phrase it as an open question to raise in interview.
Be specific about what additional evidence would be useful.
One sentence only. No preamble.`;

  return callLLM(prompt, 40);
}

// ─── Follow-up question generation ───────────────────────────────────────────

const BANNED_STEMS = [
  "tell me about a time",
  "walk me through your",
  "describe your approach to",
  "how would you handle",
];

const FLAG_EXAMPLES: Record<string, string> = {
  SELF_REPORT_DIVERGENCE_COMMITMENT:
    `Example probe: "You indicated that you sometimes leave tasks unfinished when you lose interest — but in the recent-work item you described driving a project through to completion despite setbacks. Can you walk me through a recent task you didn't finish, and what happened?"`,
  INTEGRITY_PATTERN_CONCERN:
    `Example probe: "In the analysis scenario you said you'd share the work and fix the flaw quietly afterward. Can you tell me about a real situation where you realised a piece of your work was flawed after it had been shared — what did you do?"`,
  EXTERNAL_ATTRIBUTION_PATTERN:
    `Example probe: "In the project-off-track question you mentioned your team's execution being the main issue. What was your own contribution to how that situation developed — including any decisions you'd make differently now?"`,
  ROLE_MISALIGNED_MOTIVATION_CEO:
    `Example probe: "You ranked mission last out of four motivators in the tradeoff question. This organisation is mission-driven in its core. What actually draws you to the role here, and how do you think about the mission dimension of the work?"`,
  SPECIFICITY_DEFICIT:
    `Example probe: "Across several of your written answers, the situations were described at a fairly high level. Pick the project or mistake you described and walk me through it again with more specifics — dates, names, exact numbers, what you said word-for-word."`,
  ROLE_FIT_MISMATCH_MARKETING_ENG:
    `Example probe: "Your answers emphasised relationship-based and traditional marketing over AI and automation. This role is explicitly engineer-first. What draws you to a role structured this way rather than a traditional marketing role?"`,
  ROLE_DIRECTION_MISMATCH_TRADITIONAL_MARKETER_ME:
    `Example probe: "You mentioned preferring authentic human connection over technology-heavy methods. This role is built around AI and automation. What draws you to an AI-first role given that preference?"`,
};

function buildCandidateTokens(texts: string[]): Set<string> {
  const tokens = new Set<string>();
  for (const t of texts) {
    for (const word of t.toLowerCase().split(/\W+/)) {
      if (word.length >= 4) tokens.add(word);
    }
  }
  return tokens;
}

function validateQuestion(question: string, candidateTokens: Set<string>): { ok: boolean; reason?: string } {
  const wordCount = question.trim().split(/\s+/).length;
  if (wordCount > 60) return { ok: false, reason: "too_long" };

  const questionMarks = (question.match(/\?/g) ?? []).length;
  if (questionMarks > 1) return { ok: false, reason: "multi_part" };

  const lower = question.toLowerCase();
  for (const stem of BANNED_STEMS) {
    if (lower.includes(stem)) return { ok: false, reason: `banned_stem:${stem}` };
  }

  // Genericness check: at least one 4+ char token from candidate's response must appear
  const questionWords = new Set(lower.split(/\W+/).filter((w) => w.length >= 4));
  const overlap = [...questionWords].some((w) => candidateTokens.has(w));
  if (!overlap) return { ok: false, reason: "generic" };

  return { ok: true };
}

type FollowUpContext = {
  surface: "flag" | "dimension";
  targetId: string;
  label: string;
  whyItMatters: string;
  relevantResponses: Array<{ sectionLabel: string; excerpt: string; rubricFeatures?: string }>;
  roleTitle: string;
  candidateTokens: Set<string>;
};

export async function generateOneFollowUp(ctx: FollowUpContext, avoidAnchors?: string[]): Promise<string> {
  const responsesText = ctx.relevantResponses
    .map((r) => `- ${r.sectionLabel}:\n  Response: "${r.excerpt}"\n${r.rubricFeatures ? `  Rubric: ${r.rubricFeatures}` : ""}`)
    .join("\n");

  const example = ctx.surface === "flag" ? (FLAG_EXAMPLES[ctx.targetId] ?? "") : "";
  const exampleBlock = example ? `\nIN-CONTEXT EXAMPLE (for calibration only — do NOT copy):\n${example}\n` : "";
  const avoidBlock = avoidAnchors && avoidAnchors.length > 0
    ? `\nCRITICAL — do NOT reference or paraphrase any of these phrases (already used in another question):\n${avoidAnchors.map((a) => `- "${a}"`).join("\n")}\nAnchor on a different piece of evidence instead.\n`
    : "";

  const prompt = `You are helping a hiring manager prepare for an interview. Generate one follow-up question that probes something specific the candidate said or did in their written assessment.

CONTEXT:
- Role: ${ctx.roleTitle}
- This question addresses: ${ctx.label}
- Why it matters: ${ctx.whyItMatters}

CANDIDATE RESPONSES RELEVANT TO THIS QUESTION:
${responsesText || "No specific excerpts available — use the flag description to probe."}
${exampleBlock}${avoidBlock}
RULES:
- Return exactly one question, plain text, no quotation marks.
- Reference something specific the candidate said, either by paraphrasing or quoting a short phrase.
- Do NOT generate generic prompts like "tell me about a time you showed resilience" or "walk me through your leadership style."
- Probe, don't confirm. If the response was vague, ask for the specific detail that was missing. If there was an inconsistency, ask about it directly but constructively.
- One probe only — no multi-part questions.
- No psychological jargon.
- Should sound like something a thoughtful hiring manager would actually say verbatim in an interview.
- Maximum 60 words.

Return one question only. No preamble, no numbering.`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = await callLLM(prompt, 70);
    if (!raw) continue;
    const question = raw.replace(/^["']|["']$/g, "").trim();
    const validation = validateQuestion(question, ctx.candidateTokens);
    if (validation.ok) return question;
  }
  return "";
}

// ─── Anchor deduplication helpers ────────────────────────────────────────────

function extractQuotedPhrases(text: string): string[] {
  const matches = text.match(/\u201c([^\u201d]+)\u201d|"([^"]+)"/g) ?? [];
  return matches.map((m) => m.replace(/^[\u201c"]|[\u201d"]$/g, "").toLowerCase());
}

function sharedAnchorPhrase(q1: string, q2: string): string | null {
  const phrases1 = extractQuotedPhrases(q1);
  const phrases2 = extractQuotedPhrases(q2);
  for (const p1 of phrases1) {
    const words1 = p1.split(/\s+/);
    for (const p2 of phrases2) {
      for (let i = 0; i <= words1.length - 4; i++) {
        const ngram = words1.slice(i, i + 4).join(" ");
        if (p2.includes(ngram)) return ngram;
      }
    }
  }
  return null;
}

// ─── Gap probe for zero-flag candidates ──────────────────────────────────────

async function generateGapProbe(
  dimension: string,
  result: DimensionResult,
  evidence: EvidenceExcerpt[],
  roleTitle: string
): Promise<string> {
  const evidenceText = evidence
    .map((e) => `- ${e.sectionLabel}: "${e.responseExcerpt}"`)
    .join("\n");

  const prompt = `Generate one interview probe to gather missing evidence on a dimension with ${BAND_DISPLAY[result.band] ?? result.band} signal.

ROLE: ${roleTitle}
DIMENSION: ${DIMENSION_DISPLAY[dimension] ?? dimension}
AVAILABLE EVIDENCE:
${evidenceText || "No specific evidence available."}

This question is a VERIFICATION PROBE, not a challenge. The interviewer is filling a gap in the data.
Frame it as an invitation to share an experience that didn't come through in the written assessment.
Be specific about what kind of situation or example would be useful.
Maximum 60 words. One question only. No preamble.`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = await callLLM(prompt, 70);
    if (!raw) continue;
    const question = raw.replace(/^["']|["']$/g, "").trim();
    const wordCount = question.trim().split(/\s+/).length;
    const qMarks = (question.match(/\?/g) ?? []).length;
    if (wordCount <= 65 && qMarks >= 1) return question;
  }
  return "";
}

// Priority ranking (lower number = higher priority):
// 1: high-severity flag
// 2: priority dimension that was downgraded (band ≤ mixed, and it's a priority dim)
// 3: insufficient-signal priority dimension
// 4: medium-severity flag
// 5: moderate-positive band on a priority dimension

type RankedQuestion = { id: string; surface: "flag" | "dimension"; question: string; priority: number; ctx?: FollowUpContext };

export async function generateAllFollowUpQuestions(
  synthesis: Omit<SynthesisResult, "prose" | "computedAt">,
  itemScores: ItemScoreForProse[],
  psychoAnswers: PsychoAnswerMap,
  psychoItems: PsychoItemForProse[],
  roleAnswers: Record<string, string>,
  jobTitle: string
): Promise<FollowUpQuestions> {
  const { flags, dimensions } = synthesis;

  const priorityDims = /ceo|chief executive/i.test(jobTitle)
    ? ["honesty_humility", "conscientiousness", "composure"]
    : /marketing engineer/i.test(jobTitle)
    ? ["learning", "conscientiousness", "honesty_humility"]
    : ["conscientiousness", "honesty_humility", "composure", "learning"];

  // Build candidate token set from all response text (for genericness check)
  const allResponseTexts = [
    ...Object.values(roleAnswers),
    ...psychoItems
      .filter((p) => p.itemType === "star_behavioral")
      .map((p) => {
        const ans = psychoAnswers[p.id];
        return typeof ans === "string" ? ans : "";
      }),
  ];
  const candidateTokens = buildCandidateTokens(allResponseTexts);

  // ── Per-flag questions ─────────────────────────────────────────────────────
  const byFlag: Record<string, string> = {};
  const flagWork: Array<Promise<void>> = [];

  for (const flag of flags) {
    if (flag.severity === "operational") continue;

    flagWork.push((async () => {
      // Build relevant responses from contributing items
      const relevantResponses: FollowUpContext["relevantResponses"] = [];
      for (const ci of flag.contributingItems) {
        const psychoItem = psychoItems.find((p) => p.itemId === ci.itemId);
        if (psychoItem) {
          const ans = psychoAnswers[psychoItem.id];
          const ansText = typeof ans === "string" ? ans : "";
          const score = itemScores.find((s) => s.itemId === ci.itemId && s.status === "scored");
          const rubricFeatures = score?.features
            ? Object.entries(score.features)
                .slice(0, 3)
                .map(([k, v]) => `${k}: ${v.value}`)
                .join(", ")
            : undefined;
          relevantResponses.push({
            sectionLabel: ci.sectionLabel,
            excerpt: excerptText(ansText, 120),
            rubricFeatures,
          });
        } else if (ci.itemId === "ROLE_Q") {
          // Role-specific answers
          const combined = Object.values(roleAnswers).join(" ");
          relevantResponses.push({
            sectionLabel: ci.sectionLabel,
            excerpt: excerptText(combined, 120),
          });
        } else if (ci.itemId === "C-T1" || ci.itemId === "C-T2" || ci.itemId.startsWith("C-CC")) {
          relevantResponses.push({
            sectionLabel: ci.sectionLabel,
            excerpt: ci.excerpt,
          });
        }
      }

      const question = await generateOneFollowUp({
        surface: "flag",
        targetId: flag.id,
        label: flag.label,
        whyItMatters: flag.description.split(".")[0] ?? flag.description,
        relevantResponses,
        roleTitle: jobTitle,
        candidateTokens,
      });
      if (question) byFlag[flag.id] = question;
    })());
  }

  await Promise.all(flagWork);

  // ── Per-dimension questions (priority dims with < strong_positive band) ──────
  const byDimension: Record<string, string> = {};
  const dimWork: Array<Promise<void>> = [];
  const dimContexts: Record<string, FollowUpContext> = {};

  for (const dim of priorityDims) {
    const dimResult = dimensions[dim];
    if (!dimResult) continue;

    const { band } = dimResult;
    // Only generate a dimension probe if there's something to probe
    // Skip unusually_strong and strong_positive (no probe needed)
    if (band === "unusually_strong" || band === "strong_positive" || band === "insufficient_signal") continue;

    dimWork.push((async () => {
      const evidence = buildDimensionEvidence(dim, itemScores, psychoAnswers, psychoItems, dimResult.fcTally, dimResult.fcMax, undefined);

      const whyItMatters =
        band === "concern"
          ? `Multiple signals converge on a concern here — probe to understand the pattern.`
          : band === "mixed"
          ? `Evidence is mixed — behavioural and forced-choice signals point in different directions.`
          : band === "moderate_positive"
          ? `Positive signal but with limited depth — probe to confirm the pattern holds.`
          : `Limited signal — not enough evidence to read this dimension confidently.`;

      const ctx: FollowUpContext = {
        surface: "dimension",
        targetId: dim,
        label: DIMENSION_DISPLAY[dim] ?? dim,
        whyItMatters,
        relevantResponses: evidence.map((e) => ({ sectionLabel: e.sectionLabel, excerpt: e.responseExcerpt, rubricFeatures: e.rubricFeatures })),
        roleTitle: jobTitle,
        candidateTokens,
      };
      dimContexts[dim] = ctx;
      const question = await generateOneFollowUp(ctx);
      if (question) byDimension[dim] = question;
    })());
  }

  await Promise.all(dimWork);

  // ── Rank all questions for top-3 ─────────────────────────────────────────
  const ranked: RankedQuestion[] = [];
  const flagContexts: Record<string, FollowUpContext> = {};

  for (const flag of flags) {
    const q = byFlag[flag.id];
    if (!q) continue;
    const priority = flag.severity === "high" ? 1 : 4;
    // Rebuild flag context for potential regeneration
    const relevantResponses: FollowUpContext["relevantResponses"] = [];
    for (const ci of flag.contributingItems) {
      const psychoItem = psychoItems.find((p) => p.itemId === ci.itemId);
      if (psychoItem) {
        const ans = psychoAnswers[psychoItem.id];
        const ansText = typeof ans === "string" ? ans : "";
        relevantResponses.push({ sectionLabel: ci.sectionLabel, excerpt: excerptText(ansText, 120) });
      } else if (ci.itemId === "C-T1" || ci.itemId === "C-T2" || ci.itemId.startsWith("C-CC")) {
        relevantResponses.push({ sectionLabel: ci.sectionLabel, excerpt: ci.excerpt });
      }
    }
    const ctx: FollowUpContext = {
      surface: "flag",
      targetId: flag.id,
      label: flag.label,
      whyItMatters: flag.description.split(".")[0] ?? flag.description,
      relevantResponses,
      roleTitle: jobTitle,
      candidateTokens,
    };
    flagContexts[flag.id] = ctx;
    ranked.push({ id: flag.id, surface: "flag", question: q, priority, ctx });
  }

  for (const dim of priorityDims) {
    const q = byDimension[dim];
    if (!q) continue;
    const band = dimensions[dim]?.band;
    const priority =
      band === "concern" || band === "mixed" ? 2 :
      band === "limited_signal" || band === "insufficient_signal" ? 3 : 5;
    ranked.push({ id: dim, surface: "dimension", question: q, priority, ctx: dimContexts[dim] });
  }

  ranked.sort((a, b) => a.priority - b.priority);

  // Build topThree with anchor deduplication (item 3):
  // If two selected questions share the same quoted evidence anchor, regenerate
  // the lower-priority one with an instruction to avoid the shared phrase.
  const topThree: string[] = [];
  for (let i = 0; i < Math.min(ranked.length, 3); i++) {
    const entry = ranked[i];
    let question = entry.question;

    // Check against already-accepted questions for shared anchor
    const usedAnchors: string[] = [];
    for (const accepted of topThree) {
      const shared = sharedAnchorPhrase(accepted, question);
      if (shared) usedAnchors.push(shared);
    }

    if (usedAnchors.length > 0 && entry.ctx) {
      const regenerated = await generateOneFollowUp(entry.ctx, usedAnchors);
      if (regenerated) question = regenerated;
    }

    topThree.push(question);
  }

  // Item 6: for clean candidates with no pattern flags, generate a gap probe
  // targeting the lowest-confidence priority dimension
  if (topThree.length === 0 && flags.length === 0) {
    const BAND_SIGNAL_ORDER: Record<string, number> = {
      insufficient_signal: 0, limited_signal: 1, mixed: 2,
      moderate_positive: 3, strong_positive: 4, unusually_strong: 5, concern: 2,
    };
    const gapDim = [...priorityDims]
      .filter((d) => dimensions[d])
      .sort((a, b) => (BAND_SIGNAL_ORDER[dimensions[a].band] ?? 3) - (BAND_SIGNAL_ORDER[dimensions[b].band] ?? 3))[0];

    if (gapDim && dimensions[gapDim]) {
      const gapResult = dimensions[gapDim];
      const evidence = buildDimensionEvidence(gapDim, itemScores, psychoAnswers, psychoItems, gapResult.fcTally, gapResult.fcMax, undefined);
      const probe = await generateGapProbe(gapDim, gapResult, evidence, jobTitle);
      if (probe) topThree.push(probe);
    }
  }

  return { byFlag, byDimension, topThree };
}

// ─── Full prose generation orchestrator ──────────────────────────────────────

type ItemScoreForProse = {
  itemId: string;
  status: string;
  bandEstimate: string;
  features: Record<string, { value: string; justification?: string; supporting_excerpt?: string }> | null;
};

type PsychoItemForProse = {
  id: string;
  itemId: string;
  itemType: string;
  body: string;
};

type PsychoAnswerMap = Record<string, string | string[]>;

const STAR_SECTION_LABELS: Record<string, string> = {
  "C-S1": "Part 1 — A recent piece of work",
  "C-S2": "Part 3 — A mistake you made",
  "C-S3": "Part 5 — Changing your mind",
  "C-S4": "Part 8 — Hard feedback",
};

const STAR_PRIMARY_DIMENSION: Record<string, string> = {
  "C-S1": "conscientiousness",
  "C-S2": "honesty_humility",
  "C-S3": "learning",
  "C-S4": "interpersonal",
};

const PRIORITY_DIMS_CEO = ["honesty_humility", "conscientiousness", "composure"];
const PRIORITY_DIMS_ME = ["learning", "conscientiousness", "honesty_humility"];

function excerptText(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(" ") + "…";
}

function buildDimensionEvidence(
  dimension: string,
  itemScores: ItemScoreForProse[],
  psychoAnswers: PsychoAnswerMap,
  psychoItems: PsychoItemForProse[],
  fcTally: number,
  fcMax: number,
  ccValue: number | undefined
): EvidenceExcerpt[] {
  const evidence: EvidenceExcerpt[] = [];

  // Find the primary STAR item for this dimension
  for (const [starItemId, dim] of Object.entries(STAR_PRIMARY_DIMENSION)) {
    if (dim !== dimension) continue;
    const score = itemScores.find((s) => s.itemId === starItemId && s.status === "scored");
    if (!score) continue;

    // Find the psychoItem to get the answer
    const psychoItem = psychoItems.find((p) => p.itemId === starItemId);
    if (!psychoItem) continue;
    const answer = psychoAnswers[psychoItem.id];
    const answerText = typeof answer === "string" ? answer : "";

    // Key rubric features for this dimension
    const relevantFeatures: string[] = [];
    if (score.features) {
      const featureNames = Object.keys(score.features).slice(0, 3);
      for (const fn of featureNames) {
        const f = score.features[fn];
        relevantFeatures.push(`${fn}: ${f.value}`);
      }
    }

    evidence.push({
      sectionLabel: STAR_SECTION_LABELS[starItemId] ?? starItemId,
      responseExcerpt: excerptText(answerText, 60),
      rubricFeatures: relevantFeatures.join(", "),
    });
  }

  // Add FC signal as evidence
  if (fcTally > 0) {
    evidence.push({
      sectionLabel: "Forced-choice pairs",
      responseExcerpt: `Candidate favoured this dimension in ${fcTally} of ${fcMax} applicable pairs.`,
    });
  }

  // Add CC if relevant
  if (ccValue !== undefined) {
    const ccItemId = dimension === "conscientiousness" ? "C-CC1" : "C-CC2";
    evidence.push({
      sectionLabel: `Consistency check (${ccItemId})`,
      responseExcerpt: `Self-rated ${ccValue}/5 on the check statement.`,
    });
  }

  return evidence;
}

export async function generateAllProse(
  synthesis: Omit<SynthesisResult, "prose" | "computedAt">,
  itemScores: ItemScoreForProse[],
  psychoAnswers: PsychoAnswerMap,
  psychoItems: PsychoItemForProse[],
  jobTitle: string,
  allItemScores?: ItemScoreData[],
  roleAnswers?: Record<string, string>
): Promise<SynthesisResult["prose"]> {
  const { dimensions, flags, roleFitRead, overallConfidence, overallConfidenceDescription } = synthesis;

  // Identify priority dimensions for this role
  const priorityDims = /ceo|chief executive/i.test(jobTitle)
    ? PRIORITY_DIMS_CEO
    : /marketing engineer/i.test(jobTitle)
    ? PRIORITY_DIMS_ME
    : PRIORITY_DIMS_CEO;

  // ── Generate dimension summaries (all 5 scored dimensions) ────────────────
  const dimensionSummaries: Record<string, string> = {};
  const allScoredDims = ["conscientiousness", "honesty_humility", "composure", "learning", "interpersonal"];

  await Promise.all(
    allScoredDims.map(async (dim) => {
      const result = dimensions[dim];
      if (!result) return;

      const evidence = buildDimensionEvidence(
        dim,
        itemScores,
        psychoAnswers,
        psychoItems,
        result.fcTally,
        result.fcMax,
        undefined
      );
      dimensionSummaries[dim] = await generateDimensionProse(dim, result, evidence);
    })
  );

  // ── Role-fit rationale (interpretive) ─────────────────────────────────────
  const roleFitRationale = await generateRoleFitRationale(jobTitle, roleFitRead, flags);

  // ── Confidence rationale (factual) ────────────────────────────────────────
  const scoredStarCount = itemScores.filter((s) => s.status === "scored" && s.itemId.startsWith("C-S")).length;
  const failedStarCount = itemScores.filter((s) => s.status === "scoring_failed" && s.itemId.startsWith("C-S")).length;
  const confidenceRationale = await generateConfidenceRationale(
    overallConfidence,
    overallConfidenceDescription ?? "Moderate signal",
    scoredStarCount,
    failedStarCount,
    dimensions
  );

  // ── Strength statements: only from dims with genuinely positive bands ──────
  // Do NOT generate strengths for concern, mixed, or limited_signal dimensions.
  const strengthCandidates = allScoredDims.filter((dim) => {
    const band = dimensions[dim]?.band;
    return band === "strong_positive" || band === "unusually_strong" || band === "moderate_positive";
  });

  const strengths: string[] = [];
  await Promise.all(
    strengthCandidates.slice(0, 4).map(async (dim) => {
      const result = dimensions[dim];
      if (!result) return;
      const evidence = buildDimensionEvidence(dim, itemScores, psychoAnswers, psychoItems, result.fcTally, result.fcMax, undefined);
      const strength = await generateStrength(dim, result.band, evidence);
      if (strength) strengths.push(strength);
    })
  );

  // ── Open questions (insufficient-signal priority dimensions) ──────────────
  const openQuestionDims = priorityDims.filter((dim) => {
    const band = dimensions[dim]?.band;
    return band === "insufficient_signal" || band === "limited_signal";
  });

  const openQuestions: string[] = [];
  await Promise.all(
    openQuestionDims.slice(0, 3).map(async (dim) => {
      const result = dimensions[dim];
      const whyInsufficient =
        result?.band === "insufficient_signal"
          ? "No behavioural evidence scored and insufficient forced-choice signal."
          : "Limited evidence — only one source contributed.";
      const q = await generateOpenQuestion(dim, whyInsufficient);
      if (q) openQuestions.push(q);
    })
  );

  // ── Follow-up interview questions (Phase 2) ──────────────────────────────
  let followUpQuestions: FollowUpQuestions | undefined;
  try {
    followUpQuestions = await generateAllFollowUpQuestions(
      synthesis,
      itemScores,
      psychoAnswers,
      psychoItems,
      roleAnswers ?? {},
      jobTitle
    );
  } catch {
    // Non-fatal: questions omitted if generation fails
  }

  return {
    dimensionSummaries,
    roleFitRationale,
    confidenceRationale,
    strengths: strengths.filter(Boolean),
    openQuestions: openQuestions.filter(Boolean),
    followUpQuestions,
  };
}
