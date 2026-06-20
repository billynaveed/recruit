# Phase 2 — Auto-generated Follow-up Interview Questions

**Goal:** Generate 2–3 specific, candidate-grounded follow-up interview questions that appear in the 60-second panel and attached to each pattern flag and each dimension card.

This is where the product becomes uniquely useful to a hiring manager. The questions must be specific to what the candidate actually said — not generic behavioural prompts.

---

## 2.1 When follow-up questions are generated

Three surfaces need questions:

1. **60-second panel, "Interview focus" section:** 2–3 questions ranked by importance
2. **Each high-severity or medium-severity pattern flag:** 1 follow-up question per flag
3. **Each dimension card:** 1 follow-up question (optional per card, based on whether the dimension has a meaningful probe)

Use the existing LLM fallback cascade (GLM → Gemma → Sonnet). **Strong recommendation: use Sonnet as primary for this step**, even if cost-sensitive, because question quality is reviewer-facing and the price premium is justified. If cost is a concern, make this configurable and document the trade-off.

---

## 2.2 Prompt template for a single follow-up

```
You are helping a hiring manager prepare for an interview. Generate one follow-up question that probes something specific the candidate said or did in their written assessment.

CONTEXT:
- Role: {role_title}
- Dimension or flag this question addresses: {dimension_or_flag_label}
- Why it matters: {1-line description}

CANDIDATE RESPONSES THAT MATTER FOR THIS QUESTION:
{include 1-3 relevant items with:
  - section label
  - the candidate's actual response (up to 120 words)
  - the relevant rubric feature values
}

RULES:
- Return exactly one question, plain text.
- Reference something specific the candidate said, either by paraphrasing or quoting a short phrase.
- Do NOT generate generic behavioural prompts like "tell me about a time you showed resilience" or "walk me through your leadership style."
- The question should probe, not confirm. If the candidate's response was vague, ask for the specific detail that was missing. If the response showed an inconsistency, ask about the inconsistency directly but constructively.
- Do NOT ask multi-part questions. One probe, one question.
- Do NOT use psychological jargon.
- The question should be usable verbatim in an interview — it should sound like something a thoughtful hiring manager would actually say.

Return one question. No preamble, no quotation marks around the question, no numbering.
```

---

## 2.3 Follow-up for each pattern flag (specific examples)

For each flag type, the prompt should guide generation toward a specific probe. Examples (not to be hardcoded — use them as in-context examples in the prompt):

### SELF_REPORT_DIVERGENCE_COMMITMENT
> Example probe: "You indicated that you sometimes leave tasks unfinished when you lose interest — but in the recent-work item you described driving a project through to completion despite setbacks. Can you walk me through a recent task you didn't finish, and what happened?"

### INTEGRITY_PATTERN_CONCERN
> Example probe: "In the analysis scenario you said you'd share the work and fix the flaw quietly afterward. Can you tell me about a real situation where you realised a piece of your work was flawed after it had been shared — what did you do?"

### EXTERNAL_ATTRIBUTION_PATTERN
> Example probe: "In the project-off-track question you mentioned your team's execution being the main issue. What was your own contribution to how that situation developed — including any decisions you'd make differently now?"

### ROLE_MISALIGNED_MOTIVATION_CEO (mission ranked last)
> Example probe: "You ranked mission last out of four motivators in the tradeoff question. YFS is mission-driven in its core. What actually draws you to the role here, and how do you think about the mission dimension of the work?"

### SPECIFICITY_DEFICIT
> Example probe: "Across several of your written answers, the situations were described at a fairly high level. Pick the [project/mistake/feedback conversation] you described and walk me through it again with more specifics — dates, names, exact numbers, what you said word-for-word."

### ROLE_FIT_MISMATCH_MARKETING_ENG
> Example probe: "Your answers emphasised relationship-based and traditional marketing over AI and automation. This role is explicitly engineer-first. What draws you to a role structured this way rather than a traditional marketing role?"

Include 2–3 of these examples in the prompt as in-context anchors, tailored to the flag type being handled.

---

## 2.4 Ranking questions for the 60-second panel

When more than 3 candidate-specific questions are generated across flags and dimensions, rank them and show the top 3 in the 60-second panel.

Ranking heuristic (deterministic):

```
Priority 1 (highest): questions attached to high-severity pattern flags
Priority 2: questions about dimensions where the role-fit read was downgraded
Priority 3: questions about insufficient-signal dimensions on priority-for-role dimensions
Priority 4: questions attached to medium-severity flags
Priority 5: questions from dimension cards with moderate_positive bands (for deeper probing)
```

If two or more questions tie on priority, prefer the one that references more specific response detail (longer quoted excerpt).

---

## 2.5 Caching and regeneration

Cache generated questions by `hash(candidate_id, flag_id or dimension_id, source_content)`.

Provide a "Regenerate question" button next to each question for reviewers who find the generated question unhelpful. Log when reviewers regenerate (signal for improving the prompt over time).

---

## 2.6 Quality safeguards

Before a generated question is saved:

1. **Length check:** reject if over 60 words, regenerate with tightened prompt
2. **Genericness check:** reject if the question does not contain any token that appears in the candidate's response. This is a cheap heuristic — if the question references no specific candidate content, it's generic and should regenerate
3. **Multi-part check:** reject if the question contains more than one "?" or more than one "and" joining distinct probes
4. **Banned-phrase check:** reject if the question contains any of: "tell me about a time", "walk me through your", "describe your approach to", "how would you handle" (all generic behavioural stems). Log the rejection reason for prompt refinement.

---

## 2.7 Testing — do not mark Phase 2 complete until

Run against all 8 seeded candidates. For each candidate, verify:

- **Marcus Webb:** 2–3 questions, each specific to his actual responses (e.g., CRM migration, board revenue projections, junior colleague's NPS data). No generic questions.
- **Patricia Wu:** Questions probing the specificity deficit and the mission-last ranking. E.g., "In the project-off-track answer you said the timeline slipped because of 'some challenges' — what exactly were those challenges and what did you personally do?"
- **Robert Kane:** Questions directly probing external attribution. E.g., "You described the programme delay as 'team didn't deliver what they were supposed to.' What was your own contribution to how that situation played out?"
- **Amanda Fox:** Questions probing the integrity pattern — should reference C-CC2 endorsement AND C-T2 option C AND the reframing of the missed deadline. This is the hardest test case; if the questions here are generic, the pipeline isn't working.
- **Priya Kumar:** Questions should probe strengths for depth, not concerns. E.g., about her Make/Notion freelance tracking system or the "founders before they were famous" content series.
- **Tom Bradley:** Questions probing specificity deficits and stability-first motivation.
- **Lucy Chen:** Questions probing the role-fit mismatch — should reference her "authentic human connection over technology" framing from role-specific answers.
- **James Wong:** Questions probing marketing instinct — should reference his technical-first campaign answer.

If any of these candidates get generic questions ("tell me about a time you..."), the quality safeguards in §2.6 are not working.
