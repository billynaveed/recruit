# Phase 1 — Synthesis Layer

**Goal:** Transform raw per-item rubric data into reviewer-facing dimension bands, contradiction flags, and a role-fit read. This is the highest-priority phase.

---

## 1.1 Dimension-level band aggregation (deterministic — no LLM)

For each of the six core dimensions, aggregate per-item signals into a single dimension-level band plus confidence indicator.

### Evidence source mapping

```
Conscientiousness:
  primary:   C-S1 (STAR band)
  FC tally:  C-F1, C-F4, C-F5, C-F8, C-F10, C-F11
  check:     C-CC1 (consistency)
  secondary: C-T2 (scenario contribution)

Honesty-Humility:
  primary:   C-S2 (STAR band)
  FC tally:  C-F2, C-F5, C-F9, C-F12
  check:     C-CC2 (counterintuitive scoring — see rule below)
  scenario:  C-T2

Composure:
  secondary: C-S1, C-S2, C-S4 (secondary contributions)
  FC tally:  C-F3, C-F10

Learning Orientation:
  primary:   C-S3 (STAR band)
  FC tally:  C-F1, C-F3, C-F6, C-F11

Interpersonal Style (report as PROFILE, not single band):
  primary:   C-S4 (STAR rubric features)
  secondary: C-S3
  FC tally:  C-F2, C-F6, C-F8, C-F9, C-F12

Motivational Drivers (report as PROFILE, not single band):
  primary:   C-T1 (ranking)
  FC tally:  C-F4, C-F7, C-F9, C-F13
```

### C-CC2 counterintuitive scoring rule (critical)

C-CC2 asks: *"I sometimes present my work as more complete or polished than it actually is, to get buy-in from others."*

- **Agree or Strongly agree (4 or 5):** When this converges with other honesty-humility positive signals (C-F2=A, C-F9=A, C-F12=A, C-T2=A), treat as a **positive H-H contribution** — the candidate is honestly acknowledging a common self-presentation behaviour. This is the designed behaviour of this item.
- **Agree or Strongly agree (4 or 5):** When this converges with concerning signals (C-T2=C or D, externalized attribution in C-S2, C-F9=B), treat as a **high-severity flag** — see pattern detection in §1.3.
- **Neither (3):** Ambiguous, do not contribute positively or negatively.
- **Disagree or Strongly disagree (1 or 2):** Neutral or mildly positive depending on corroboration.

Do not expose the counterintuitive logic to candidates in any UI. It's internal scoring only.

### Aggregation rules

For each dimension:

1. Count contributing items (STAR items that scored successfully + FC tallies above 0 + consistency checks with clear signal).
2. **Insufficient signal:** if fewer than 2 independent items contributed → return `insufficient_signal`. Do not guess.
3. **Convergence check:** are the contributing signals pointing in the same direction?
   - All positive → band = same direction as the strongest signal, capped at the highest STAR band
   - All negative → band = same direction as the strongest negative
   - Conflicting → band = `mixed`, and store a `conflict_note` describing what conflicts
4. **Confidence indicator:**
   - `rich_signal` — 3+ items contributed, all converging
   - `moderate_signal` — 2 items contributed, or 3+ with some noise
   - `limited_signal` — 1 strong item + weak corroboration

### Data model

```typescript
type DimensionEstimate = {
  candidate_id: string
  dimension: 'conscientiousness' | 'honesty_humility' | 'composure' | 'learning' | 'interpersonal' | 'motivation' | 'engineer_mindset_ai_fluency'
  band: 'unusually_strong' | 'strong_positive' | 'moderate_positive' | 'mixed' | 'limited_signal' | 'insufficient_signal' | 'concern'
  confidence: 'rich_signal' | 'moderate_signal' | 'limited_signal'
  contributing_items: string[]        // item IDs
  conflict_note: string | null         // if band=mixed, what conflicts
  is_profile: boolean                  // true for interpersonal, motivation
  profile_data: object | null          // see §1.1.5
}
```

### Profile dimensions (Interpersonal, Motivation)

These do not get a single band. They return structured profile data.

**Interpersonal Style profile:**
```typescript
{
  directness: 'direct' | 'hedged' | 'unclear'                    // from C-S4
  conflict_approach: 'engages' | 'avoids' | 'mixed'              // from C-S4 + C-F8
  regard_for_others: 'respectful' | 'dismissive' | 'defensive'   // from C-S4 rubric
  follow_through: 'tracked' | 'absent'                           // from C-S4 rubric
  warmth_vs_directness_preference: string                        // from FC tallies
}
```

**Motivational Drivers profile:**
```typescript
{
  top_motivators: string[]          // top 2 from C-T1 ranking
  bottom_motivator: string          // last in C-T1
  fc_contributions: object          // which FC motivation pairs they picked
  role_alignment_note: string       // computed per role — see §1.4
}
```

### Engineer Mindset + AI Fluency dimension (role-family specific)

Aggregate from RF-S1, RF-S2, RF-S3, RF-S4, and role-specific SJT (if present). Same aggregation rules. Only render this dimension card when the candidate has taken a role-family bundle that includes these items.

---

## 1.2 Dimension-level prose summaries (LLM)

For each dimension card, generate a 2–3 sentence prose summary. Use the existing fallback cascade (GLM → Gemma → Sonnet).

### Prompt template

```
You are writing a brief summary of a candidate's signal on one behavioural dimension, for a hiring manager. Write 2-3 sentences.

DIMENSION: {dimension_display_name}
BAND: {band_display_string}
CONFIDENCE: {confidence_display_string}

EVIDENCE (item excerpts and rubric features):
{for each contributing item, include:
  - Item section label (e.g., "Part 1 — A recent piece of work")
  - Up to 60 words of the candidate's response
  - Key rubric feature values relevant to this dimension
}

RULES:
- Exactly 2-3 sentences. No bullet points. No headings.
- Reference items by their section label (e.g., "In the recent-work item..."), never by internal IDs (not "C-S1").
- Cite specific phrases from the candidate's response when relevant, in quotation marks.
- Do NOT use psychological jargon. Do NOT speculate about personality beyond what the evidence shows.
- Do NOT describe the candidate as "high in X" or "low in X". Describe what they said and did.
- Do NOT use clinical terms (anxious, narcissistic, defensive as a trait, etc.).
- If the band is "mixed" or "insufficient signal", explain what's missing or what conflicts.

Return only the summary text. No preamble, no formatting, no JSON.
```

### Caching

Cache summaries by `hash(candidate_id, dimension, evidence_content)` to avoid regeneration on page view.

---

## 1.3 Pattern and contradiction detection (deterministic rules)

Run these pattern detectors across each candidate's full response set. Each returns zero or more flags with structured data.

### Detector rules

**SELF_REPORT_DIVERGENCE_COMMITMENT** (severity: high)
```
Trigger: C-CC1 >= 4 AND (
    C-F1 picked option A ("stick with commitments")
    OR C-S1 rubric.problem_ownership == "owned"
    OR C-S1 band in {strong_positive, moderate_positive}
)
Label: "Self-report diverges on commitment and follow-through"
Description: "Candidate agrees that they 'sometimes leave tasks unfinished when they lose interest,' but their forced-choice responses and/or behavioural evidence suggest the opposite. Worth probing with a specific example."
```

**INTEGRITY_PATTERN_CONCERN** (severity: high)
```
Trigger: C-CC2 >= 4 AND C-T2 in {C, D} AND (
    C-S2 rubric.ownership in {externalized, partial}
    OR C-S2 rubric.mistake_genuineness == "minor_or_reshaped"
    OR C-S2 rubric.disclosure_behavior == "concealed_or_unclear"
)
Label: "Converging pattern on transparency and ownership"
Description: "Multiple items point in the same direction: self-report of overstating work (C-CC2), non-transparent scenario choice (C-T2), and reframing/externalizing the mistake described in behavioural Part 3. This is a serious warning pattern for any role that requires honest reporting. Probe explicitly in interview."
```

**EXTERNAL_ATTRIBUTION_PATTERN** (severity: high)
```
Trigger: count of STAR items where rubric.attribution_pattern == "external" OR rubric.ownership == "externalized" >= 2
Label: "Consistent external attribution across behavioural items"
Description: "In {N} of {total} behavioural items, the candidate attributed problems primarily to others or circumstances rather than acknowledging their own contributing decisions. Review the specific items and consider whether this pattern would hold in the role."
```

**ROLE_MISALIGNED_MOTIVATION_CEO** (severity: medium, CEO/leadership roles only)
```
Trigger: role in {CEO, Executive, Leadership} AND C-T1 ranking places "mission" at position 3 or 4
Label: "Mission ranked low for a mission-driven leadership role"
Description: "Candidate ranked mission {position} of 4 in the motivation tradeoff. For a CEO role at a mission-driven organisation, this is worth probing — not disqualifying, but the interview should test whether their genuine motivation aligns with the role."
```

**ROLE_MISALIGNED_MOTIVATION_STABILITY** (severity: medium, high-autonomy roles)
```
Trigger: role in {Marketing Engineer, CEO, Senior IC, Founder roles} AND C-T1 ranking places "stability" at position 1 or 2
Label: "Stability ranked high for a high-ambiguity role"
Description: "Candidate ranked stability as a top-2 motivator. This role involves high ambiguity and self-direction. Worth testing in interview whether the candidate has had successful experience operating in less structured environments."
```

**SPECIFICITY_DEFICIT** (severity: medium)
```
Trigger: count of STAR items where rubric.specificity == "low" >= 3
Label: "Behavioural responses consistently lack specificity"
Description: "Across {N} behavioural items, the candidate gave abstract or generic descriptions rather than concrete, specific accounts. Could indicate weak self-reflection, low agency in the situations described, or a preparation issue. Probe with targeted 'tell me exactly what you did next' questions."
```

**ROLE_FIT_MISMATCH_MARKETING_ENG** (severity: high, Marketing Engineer role only)
```
Trigger: role == "Marketing Engineer" AND (
    RF-S4 response == "Strongly prefer Role 1"
    OR role-specific questions show no AI/automation/building evidence
    OR candidate explicitly rejects tech/AI orientation in role-specific answers
)
Label: "Candidate profile does not match the engineer-mindset frame of this role"
Description: "The Marketing Engineer role requires AI fluency and a builder instinct. The candidate's responses indicate a traditional marketing orientation without the technical or AI-first frame. This is a role-fit mismatch, not necessarily a weakness."
```

**TECHNICAL_WITHOUT_DOMAIN_MARKETING_ENG** (severity: high, Marketing Engineer role only)
```
Trigger: role == "Marketing Engineer" AND (
    role-specific answers focus primarily on technical/infrastructure with no audience/message/story reasoning
    AND no evidence of creative output in role-specific questions
)
Label: "Technical strength without marketing or creative instinct"
Description: "Candidate demonstrates technical ability but their answers to role-specific questions focus on infrastructure, measurement, and tools rather than audience, message, or creative direction. Strong profile for an engineering role, likely mismatch for Marketing Engineer."
```

**SCORING_FAILURE** (severity: operational)
```
Trigger: any STAR item band == "scoring_failed"
Label: "One or more items did not score successfully"
Description: "The following items failed to score: {list}. Click to retry."
Action: show retry button that re-invokes the scoring pipeline for failed items only.
```

### Flag structure

```typescript
type PatternFlag = {
  id: string
  rule_name: string
  severity: 'high' | 'medium' | 'operational'
  label: string
  description: string
  contributing_items: Array<{
    item_id: string
    section_label: string
    excerpt: string  // max 40 words
  }>
  suggested_followup_id: string | null  // populated by Phase 2
}
```

### Display rules

- Surface flags in a dedicated **"Patterns and concerns"** panel near the top of the report
- High-severity flags: prominent styling (red accent border, not a bar chart, not emoji)
- Medium-severity flags: neutral styling with a warning icon
- Operational flags: neutral styling with a retry action
- If zero flags fire: show nothing (do not show an empty "no flags" panel — it adds noise)

---

## 1.4 Role-fit read (deterministic + LLM polish)

At the top of each report, produce a one-line role-fit read with mandatory caveat.

### Computation

```
Step 1: Start from a base assessment based on the dimensions most relevant to the role.

For Marketing Engineer role:
  Priority dimensions: Engineer Mindset + AI Fluency, Learning Orientation, Conscientiousness
  
For CEO role:
  Priority dimensions: Honesty-Humility, Composure, Conscientiousness, Motivational profile alignment with mission

For each priority dimension, score:
  strong_positive or unusually_strong  -> +2
  moderate_positive                    -> +1
  mixed                                -> 0
  limited_signal                       -> -1
  concern                              -> -2
  insufficient_signal                  -> 0 (but note in caveat)

Sum the priority-dimension scores.

Step 2: Apply flag downgrades.
  Each high-severity flag: -2
  Each medium-severity flag: -1

Step 3: Map final score to band:
  >= 5  -> Strong fit
  3-4   -> Likely fit
  0-2   -> Mixed fit
  -1 to -3 -> Weak fit
  <= -4 -> Likely mis-fit
```

### Role-fit display

One line, prominent at the top of the report:

> **Role-fit read:** Strong fit / Likely fit / Mixed fit / Weak fit / Likely mis-fit

Immediately followed, in smaller type:

> *This is a summary of observed signal against the hiring frame for this role. It is not a hire/no-hire recommendation — an interview is required to make that call.*

### Role-fit rationale (LLM, short)

Generate a 1–2 sentence rationale explaining the role-fit band. Same fallback cascade.

Prompt:

```
You are explaining a role-fit summary to a hiring manager. Write 1-2 sentences.

ROLE: {role_title}
ROLE-FIT READ: {band}

KEY DIMENSION SIGNALS:
{list of priority dimensions with their bands}

PATTERN FLAGS:
{list of flag labels, if any}

RULES:
- 1-2 sentences only.
- Reference specific signals, not generic descriptions.
- Do NOT recommend hire or no-hire.
- Do NOT use jargon.
- If band is negative, be specific about what concerns drove it.

Return only the rationale. No preamble.
```

---

## 1.5 60-second panel (top of report)

This is the first thing a reviewer sees. Everything else is progressive disclosure below it.

### Structure

```
┌─────────────────────────────────────────────────────────┐
│ {Candidate name} — {Role title}                         │
│ Submitted {date} · Completed in {duration}              │
│                                                         │
│ ROLE-FIT READ: {band}                                   │
│ {1-2 sentence rationale}                                │
│ {caveat italics}                                        │
│                                                         │
│ OVERALL CONFIDENCE: {rich / moderate / limited} signal  │
│                                                         │
│ ── PATTERNS AND CONCERNS ─────────────────────────────  │
│ [zero or more flag cards, severity-sorted]              │
│                                                         │
│ ── STRENGTHS ─────────────────────────────────────────  │
│ • {strength 1, tied to a dimension, 1 sentence}         │
│ • {strength 2, tied to a dimension}                     │
│ • {strength 3, tied to a dimension}                     │
│                                                         │
│ ── OPEN QUESTIONS ────────────────────────────────────  │
│ • {open question 1 about an insufficient-signal area}   │
│ • {open question 2}                                     │
│                                                         │
│ ── INTERVIEW FOCUS ───────────────────────────────────  │
│ • {follow-up interview question 1 — Phase 2}            │
│ • {follow-up interview question 2 — Phase 2}            │
│ • {follow-up interview question 3 — Phase 2}            │
└─────────────────────────────────────────────────────────┘
```

### Generating strengths (LLM)

For each dimension with band `strong_positive` or `unusually_strong`, generate a one-sentence strength statement. Return 3–5 total, picking the most distinctive ones.

Prompt:

```
Summarize one strength in a single sentence, for a hiring manager scanning a candidate summary.

DIMENSION: {dimension}
BAND: {band}
KEY EVIDENCE: {1-2 item excerpts with rubric feature values}

RULES:
- Exactly one sentence.
- Reference the item by section label.
- Use a specific phrase from the response if available.
- Do NOT use jargon or clinical terms.
- Do NOT say the candidate is "high in X".

Return one sentence only.
```

### Generating open questions

For each dimension with band `insufficient_signal` or `limited_signal` that is a priority dimension for the role, generate a one-sentence open question.

Prompt:

```
Write one open question for a hiring manager about a dimension where the assessment did not produce enough signal.

DIMENSION: {dimension}
WHY INSUFFICIENT: {e.g., "Only one item contributed — no behavioural evidence"}

RULES:
- One sentence, phrased as an open question to raise in interview.
- Do NOT use jargon.
- Be specific about what additional evidence would be useful.

Return one sentence only.
```

---

## 1.6 Forced-choice display — change from tally to rank-order

Remove the "4 / 13" ratio display entirely. It misreads as a score.

Replace with rank-ordered prose:

> **Forced-choice profile:** Strongest preference toward Honesty-Humility and Conscientiousness, with Composure as a secondary signal. Lower signal on Learning Orientation and Interpersonal warmth.

Generation: deterministic. Rank dimensions by tally, group into strong (top 2), secondary (middle), weaker (bottom 2), render as the prose template above.

Keep a detail panel (collapsed by default, expandable) showing the raw per-pair picks for debugging and transparency, labelled clearly as "Scoring detail — for auditing."

---

## 1.7 Motivational ranking display

Currently shows:
```
1. scope
2. autonomy
3. stability
4. mission
```

Replace with contextualised prose:

> **Motivational priorities:** Scope and Autonomy rank highest. Mission ranks last of four.
>
> *For a mission-driven leadership role, mission ranking last is worth probing in interview.*

The italic contextualising line appears only when the ranking meaningfully conflicts with the role (e.g., mission last for CEO; stability first for Marketing Engineer). Use the role-misalignment flag rules from §1.3 to trigger.

---

## 1.8 Testing — do not mark Phase 1 complete until

Run the reviewer view for all 8 seeded candidates. The ground truth is in `CANDIDATE_GUIDE.md`.

You should now be able to distinguish, **from the 60-second panel alone without scrolling further:**

- **Marcus Webb:** Strong fit, no flags, converging H-H and Conscientiousness positive
- **Patricia Wu:** Mixed fit, specificity-deficit flag, mission-last flag, moderate signal overall
- **Robert Kane:** Weak fit or Likely mis-fit, external-attribution flag, self-report divergence flag, mission-last flag
- **Amanda Fox:** Likely mis-fit, integrity-pattern-concern flag as prominent high-severity, mission-last flag
- **Priya Kumar:** Strong fit, engineer-mindset strong, no flags
- **Tom Bradley:** Mixed fit, specificity-deficit flag, stability-first flag
- **Lucy Chen:** Weak fit or Likely mis-fit, role-fit-mismatch flag for Marketing Engineer
- **James Wong:** Weak fit, technical-without-domain flag — but NO behavioural concern flags (he's honest and reliable, just wrong role)

If the 60-second panel doesn't make these distinctions obvious at a glance, Phase 1 is not complete.
