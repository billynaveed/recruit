import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const STANDARD_QUESTIONS = [
  {
    prompt: "Tell us about a time you identified a problem no one else had noticed and took initiative to solve it. What did you do and what happened?",
    wordLimit: 300,
    sortOrder: 1,
  },
  {
    prompt: "Describe a project or goal you worked on that did not go as planned. How did you respond and what did you learn?",
    wordLimit: 300,
    sortOrder: 2,
  },
  {
    prompt: "What is one skill or area of knowledge you have taught yourself in the past two years? Why did you pursue it and how did you go about it?",
    wordLimit: 300,
    sortOrder: 3,
  },
  {
    prompt: "Describe a situation where you disagreed with someone more senior than you. How did you handle it and what was the outcome?",
    wordLimit: 300,
    sortOrder: 4,
  },
  {
    prompt: "What is the most ambitious thing you have attempted, regardless of whether it succeeded? What drove you to try it?",
    wordLimit: 300,
    sortOrder: 5,
  },
  {
    prompt: "Where do you want to be in five years, and how does this role connect to that path?",
    wordLimit: 250,
    sortOrder: 6,
  },
];

// Core assessment items — 22 items across 5 types
// Flow order: C-S1 → C-F1–C-F7 → C-S2 → C-S3 → C-F8–C-F13 → C-T1 → C-T2 → C-S4 → C-CC1 → C-CC2 → C-R1
const PSYCHOMETRIC_ITEMS = [
  // ─── STAR Behavioral: C-S1 (warm-up) ───────────────────────────────────────
  {
    itemId: "C-S1",
    itemType: "star_behavioral",
    body: "Think about a piece of work in the last 12 months that you were personally responsible for finishing. Something went off-track partway through — a timeline slipped, a plan broke, a dependency fell through, or something else changed. Walk me through what happened, what you did about it, and how it ended up.\n\nWrite as much as you need to make the situation clear. Specifics help more than summaries.",
    options: null,
    construct: "conscientiousness",
    minLength: 150,
    sortOrder: 1,
  },
  // ─── Forced-choice block A: C-F1–C-F7 ────────────────────────────────────
  {
    itemId: "C-F1",
    itemType: "forced_choice",
    body: "Which is more like you?",
    options: [
      { id: "A", text: "I stick with what I commit to, even when it stops being the most interesting thing on my plate.", dimension: "conscientiousness" },
      { id: "B", text: "I stay alert to better approaches, even if it means rethinking what I committed to.", dimension: "learning" },
    ],
    construct: "conscientiousness",
    minLength: null,
    sortOrder: 2,
  },
  {
    itemId: "C-F2",
    itemType: "forced_choice",
    body: "Which is more like you?",
    options: [
      { id: "A", text: "I tell people the truth even when it makes the conversation harder.", dimension: "honesty_humility" },
      { id: "B", text: "I pay close attention to how I'm making people feel in a conversation.", dimension: "interpersonal" },
    ],
    construct: "honesty_humility",
    minLength: null,
    sortOrder: 3,
  },
  {
    itemId: "C-F3",
    itemType: "forced_choice",
    body: "Which is more like you?",
    options: [
      { id: "A", text: "When things go sideways, I stay level and work the problem.", dimension: "composure" },
      { id: "B", text: "When things go sideways, I step back and ask what the situation is teaching me.", dimension: "learning" },
    ],
    construct: "composure",
    minLength: null,
    sortOrder: 4,
  },
  {
    itemId: "C-F4",
    itemType: "forced_choice",
    body: "I do my best work when:",
    options: [
      { id: "A", text: "I have clear structure and clear expectations.", dimension: "conscientiousness" },
      { id: "B", text: "I have space to figure out my own approach.", dimension: "motivation_autonomy" },
    ],
    construct: "conscientiousness",
    minLength: null,
    sortOrder: 5,
  },
  {
    itemId: "C-F5",
    itemType: "forced_choice",
    body: "Which is more like you?",
    options: [
      { id: "A", text: "I'd rather miss a deadline than ship work I'm not confident in.", dimension: "honesty_humility" },
      { id: "B", text: "I'd rather ship on time and fix what's imperfect afterward.", dimension: "conscientiousness" },
    ],
    construct: "honesty_humility",
    minLength: null,
    sortOrder: 6,
  },
  {
    itemId: "C-F6",
    itemType: "forced_choice",
    body: "Which is more like you?",
    options: [
      { id: "A", text: "I seek out people who will tell me when I'm wrong.", dimension: "learning" },
      { id: "B", text: "I seek out people who will help me do my best work.", dimension: "interpersonal" },
    ],
    construct: "learning",
    minLength: null,
    sortOrder: 7,
  },
  {
    itemId: "C-F7",
    itemType: "forced_choice",
    body: "What draws you more to a role?",
    options: [
      { id: "A", text: "Work that matters to the world.", dimension: "motivation_mission" },
      { id: "B", text: "Work where I can take on substantial responsibility.", dimension: "motivation_scope" },
    ],
    construct: "motivation",
    minLength: null,
    sortOrder: 8,
  },
  // ─── STAR Behavioral: C-S2, C-S3 ────────────────────────────────────────
  {
    itemId: "C-S2",
    itemType: "star_behavioral",
    body: "Describe a time in the last year or two when you realized you had made a significant mistake at work — one that affected other people. How did you recognize it, what did you do next, and what did you learn?\n\nThe more specific you can be, the more useful your answer will be.",
    options: null,
    construct: "honesty_humility",
    minLength: 150,
    sortOrder: 9,
  },
  {
    itemId: "C-S3",
    itemType: "star_behavioral",
    body: "Describe a specific time when someone you worked with pushed back on something you believed was right, and you ended up genuinely changing your mind. What did they say, and what actually shifted for you?",
    options: null,
    construct: "learning",
    minLength: 120,
    sortOrder: 10,
  },
  // ─── Forced-choice block B: C-F8–C-F13 ───────────────────────────────────
  {
    itemId: "C-F8",
    itemType: "forced_choice",
    body: "Which is more like you?",
    options: [
      { id: "A", text: "I'll push back on a plan I think is flawed, even when the room seems aligned.", dimension: "conscientiousness" },
      { id: "B", text: "I work to find the version of a plan everyone can get behind.", dimension: "interpersonal" },
    ],
    construct: "conscientiousness",
    minLength: null,
    sortOrder: 11,
  },
  {
    itemId: "C-F9",
    itemType: "forced_choice",
    body: "Which is more like you?",
    options: [
      { id: "A", text: "I prefer to let my work speak for itself.", dimension: "honesty_humility" },
      { id: "B", text: "I believe in advocating clearly for the work I've done.", dimension: "motivation_recognition" },
    ],
    construct: "honesty_humility",
    minLength: null,
    sortOrder: 12,
  },
  {
    itemId: "C-F10",
    itemType: "forced_choice",
    body: "Which is more like you?",
    options: [
      { id: "A", text: "I can hold multiple priorities in the air without it getting to me.", dimension: "composure" },
      { id: "B", text: "I do my best work when each priority gets my full attention, one at a time.", dimension: "conscientiousness" },
    ],
    construct: "composure",
    minLength: null,
    sortOrder: 13,
  },
  {
    itemId: "C-F11",
    itemType: "forced_choice",
    body: "Which is more like you?",
    options: [
      { id: "A", text: "I'd rather try something new and get it 80% right.", dimension: "learning" },
      { id: "B", text: "I'd rather do something familiar and get it fully right.", dimension: "conscientiousness" },
    ],
    construct: "learning",
    minLength: null,
    sortOrder: 14,
  },
  {
    itemId: "C-F12",
    itemType: "forced_choice",
    body: "Which is more like you?",
    options: [
      { id: "A", text: "I'll acknowledge uncertainty in my view, even in a room of people with strong opinions.", dimension: "honesty_humility" },
      { id: "B", text: "I'll state my view with conviction, even in a room of people with strong opinions.", dimension: "interpersonal" },
    ],
    construct: "honesty_humility",
    minLength: null,
    sortOrder: 15,
  },
  {
    itemId: "C-F13",
    itemType: "forced_choice",
    body: "What's more important to you in your next role?",
    options: [
      { id: "A", text: "Real autonomy over how I operate.", dimension: "motivation_autonomy" },
      { id: "B", text: "Stability and predictability I can count on.", dimension: "motivation_stability" },
    ],
    construct: "motivation",
    minLength: null,
    sortOrder: 16,
  },
  // ─── Tradeoff items: C-T1, C-T2 ──────────────────────────────────────────
  {
    itemId: "C-T1",
    itemType: "tradeoff_rank",
    body: "Imagine you had to choose between four roles. Compensation and title are identical. Rank these in the order you'd actually pick them — most preferred first:",
    options: [
      { id: "autonomy", text: "Autonomy — high control over how you operate day to day" },
      { id: "mission", text: "Mission — work that directly connects to something you care about" },
      { id: "scope", text: "Scope — substantial responsibility and influence" },
      { id: "stability", text: "Stability — a predictable, low-volatility environment" },
    ],
    construct: "motivation",
    minLength: null,
    sortOrder: 17,
  },
  {
    itemId: "C-T2",
    itemType: "tradeoff_choice",
    body: "You've been working on a piece of analysis for three weeks. The night before you're supposed to share it with your team, you realize there's a significant flaw in the reasoning — one that probably won't be caught by anyone else in the meeting. Fixing it properly would take another week.\n\nWhat would you most likely do?",
    options: [
      { id: "A", text: "Share it tomorrow as planned, flag the flaw clearly in the meeting, and ask for time to fix it.", scores: { honesty_humility: 2, conscientiousness: 1 } },
      { id: "B", text: "Delay the meeting, take the week to fix it, and share the corrected version.", scores: { honesty_humility: 1, conscientiousness: -1 } },
      { id: "C", text: "Share it tomorrow as planned, fix the flaw quietly afterward, and move on.", scores: { honesty_humility: -1 } },
      { id: "D", text: "Share it tomorrow as planned and mention the flaw only if someone asks.", scores: { honesty_humility: -2 } },
    ],
    construct: "honesty_humility",
    minLength: null,
    sortOrder: 18,
  },
  // ─── STAR Behavioral: C-S4 ───────────────────────────────────────────────
  {
    itemId: "C-S4",
    itemType: "star_behavioral",
    body: "Tell me about a time you had to deliver feedback to someone — a peer, a report, or a manager — that you knew they wouldn't want to hear. Walk me through how you approached it, what you actually said, and what happened afterward.",
    options: null,
    construct: "interpersonal",
    minLength: 150,
    sortOrder: 19,
  },
  // ─── Consistency checks: C-CC1, C-CC2 ────────────────────────────────────
  {
    itemId: "C-CC1",
    itemType: "consistency_check",
    body: "How much do you agree with this statement?\n\n\u201cI sometimes leave tasks unfinished when I lose interest in them.\u201d",
    options: null,
    construct: "conscientiousness",
    minLength: null,
    sortOrder: 20,
  },
  {
    itemId: "C-CC2",
    itemType: "consistency_check",
    body: "How much do you agree with this statement?\n\n\u201cI sometimes present my work as more complete or polished than it actually is, to get buy-in from others.\u201d",
    options: null,
    construct: "honesty_humility",
    minLength: null,
    sortOrder: 21,
  },
  // ─── Closing reflection: C-R1 (unscored) ─────────────────────────────────
  {
    itemId: "C-R1",
    itemType: "reflection",
    body: "If a close colleague from a previous role were describing how you work, what are two things they'd likely mention — one that you're proud of, and one that you're still actively working on?",
    options: null,
    construct: "none",
    minLength: null,
    sortOrder: 22,
  },
];

const STAR_SCORING_TEMPLATE = `You are evaluating a candidate's open-ended response against a structured rubric. Your job is to extract specific features from the response — not to rate the candidate overall, not to make hiring recommendations.

ITEM PROMPT (what the candidate was asked):
{{item_prompt}}

CANDIDATE'S RESPONSE:
"""
{{response_text}}
"""

RUBRIC FEATURES TO EXTRACT:
{{rubric_features}}

RULES:
- Return ONLY a JSON object. No prose before or after. No markdown code fences.
- For each feature, return one of the allowed values exactly as written (lowercase).
- For each feature, also return a 1-sentence justification referencing specific phrases from the response.
- If the response is too short or off-topic to evaluate a feature, return "insufficient" as the value.
- Do NOT invent content that is not in the response. Do NOT speculate about the candidate's personality beyond the feature criteria.

RETURN FORMAT:
{
  "features": {
    "<feature_name>": {
      "value": "<one of allowed values>",
      "justification": "<one sentence citing specific text>",
      "supporting_excerpt": "<verbatim quote from response, max 20 words>"
    }
  },
  "overall_notes": "<one sentence on response quality>"
}`;

const FOLLOWUP_GENERATION_TEMPLATE = `You are helping a hiring manager prepare for an interview. Based on the candidate's assessment responses and the identified patterns below, generate 2-3 specific follow-up interview questions.

RULES:
- Each question must reference something specific the candidate said or did.
- Do NOT generate generic behavioral interview questions.
- Questions should probe concerns, contradictions, or under-evidenced dimensions.
- Return plain text, one question per line, no numbering, no preamble.

CANDIDATE PATTERNS:
{{patterns}}

RELEVANT EXCERPTS FROM CANDIDATE RESPONSES:
{{excerpts}}

Return 2-3 specific follow-up questions.`;

async function main() {
  const sqCount = await prisma.standardQuestion.count();
  if (sqCount === 0) {
    await prisma.standardQuestion.createMany({ data: STANDARD_QUESTIONS });
    console.log(`Seeded ${STANDARD_QUESTIONS.length} standard questions`);
  } else {
    console.log(`Standard questions already seeded (${sqCount} found), skipping`);
  }

  const piCount = await prisma.psychometricItem.count();
  if (piCount === 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.psychometricItem.createMany({ data: PSYCHOMETRIC_ITEMS as any });
    console.log(`Seeded ${PSYCHOMETRIC_ITEMS.length} psychometric items`);
  } else {
    console.log(`Psychometric items already seeded (${piCount} found), skipping`);
  }

  await prisma.promptTemplate.upsert({
    where: { key: "star_scoring" },
    create: {
      key: "star_scoring",
      body: STAR_SCORING_TEMPLATE,
      version: 1,
    },
    update: {},
  });
  console.log("Upserted prompt template: star_scoring");

  await prisma.promptTemplate.upsert({
    where: { key: "followup_generation" },
    create: {
      key: "followup_generation",
      body: FOLLOWUP_GENERATION_TEMPLATE,
      version: 1,
    },
    update: {},
  });
  console.log("Upserted prompt template: followup_generation");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
