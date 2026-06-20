# Core Items — v1 Draft

**Companion document to:** `psychology_assessment_module_spec.md`
**Status:** v1 draft, unreviewed by psychologist, unpiloted
**Author:** AI assistant working from the spec
**Purpose:** Concrete content for the core block (fixed items, all candidates, all roles)

---

## READ FIRST — Known limitations of this draft

1. **These items have not been reviewed by a trained psychologist.** They follow the principles in the spec but need expert review before shipping.
2. **Forced-choice items need empirical desirability calibration.** The MFC method only works if both options in a pair are rated as equally desirable by a reference sample. I have attempted this by judgment, but judgment is not calibration. Before shipping any forced-choice pair, run a small study: show each option alone to ~30–50 people, ask them to rate how much they'd want to describe themselves that way (1–7 scale). Pairs where option desirability differs by more than ~0.5 scale points should be rewritten.
3. **Rubrics use LLM-based extraction for open-ended items.** Rubric prompts are drafted here but will need iteration against real responses.
4. **Every item should be piloted** on internal or friendly-customer candidates before production use. Expect 20–30% of items to need revision or retirement after pilot.
5. **These are the core block only** (~21 items, all candidates, all roles). Role-family and role-specific items are separate, drawn from the library per §3 of the spec.

---

## Summary of the core block

| # | Type | Primary construct | Notes |
|---|---|---|---|
| C-S1 | STAR behavioral | Conscientiousness | secondary: Composure |
| C-S2 | STAR behavioral | Honesty-Humility | secondary: Composure |
| C-S3 | STAR behavioral | Learning Orientation | secondary: Interpersonal |
| C-S4 | STAR behavioral | Interpersonal Style | secondary: Composure |
| C-F1 to C-F13 | Forced-choice (MFC) | Mixed — see each item | 13 pairs |
| C-T1 | Tradeoff (rank) | Motivational Drivers | ranks 4 motivators |
| C-T2 | Tradeoff (scenario) | Honesty-Humility | secondary: Conscientiousness |
| C-CC1 | Consistency check | Conscientiousness | paired with C-F1 |
| C-CC2 | Consistency check | Honesty-Humility | paired with C-F12 |
| C-R1 | Reflection (unscored) | Qualitative color | closing item |

**Total: 21 items.** Expected time: 22–28 minutes.

**Flow order (see spec §7.1):**
Consent → Intro → C-S1 (warm-up STAR) → C-F1–C-F7 (FC block A, 7 pairs) → C-S2, C-S3 → C-F8–C-F13 (FC block B, 6 pairs) → C-T1, C-T2 → C-S4 → C-CC1, C-CC2 (embedded late) → C-R1 → Summary

---

## STAR Behavioral Items (open-ended)

Each STAR item is scored via LLM rubric extraction. Rubric features are evaluated independently, then combined into dimension signal via rule-based logic.

### Item C-S1 — Conscientiousness (primary) / Composure (secondary)

**Item type:** `star_behavioral`
**Layer:** `core`
**Construct (primary):** `conscientiousness`
**Construct (secondary):** `composure`

**Prompt shown to candidate:**
> Think about a piece of work in the last 12 months that you were personally responsible for finishing. Something went off-track partway through — a timeline slipped, a plan broke, a dependency fell through, or something else changed. Walk me through what happened, what you did about it, and how it ended up.
>
> *Write as much as you need to make the situation clear. Specifics help more than summaries.*

**Expected response time:** 4–6 minutes
**Minimum response length before scoring:** 150 characters (below this, item returns `insufficient_signal` and is flagged for reviewer)

**Rubric features (LLM-extracted):**

```
F1. Specificity
    Extraction prompt: "Rate the specificity of this response on a 3-point scale.
      HIGH: names a specific project/task, timeframe, people, and/or concrete artifacts or metrics.
      MEDIUM: includes some concrete details but remains partially abstract.
      LOW: largely abstract or generic, without specific anchors.
      Return exactly one word: high, medium, or low."

F2. First-person agency
    Extraction prompt: "Evaluate how much first-person agency this response conveys.
      HIGH: candidate clearly describes specific actions they personally took.
      MEDIUM: some personal actions, mixed with team-level description.
      LOW: primarily describes what the team or organization did; candidate's specific role unclear.
      Return exactly one word: high, medium, or low."

F3. Problem ownership
    Extraction prompt: "When things went off-track, did the candidate drive the resolution?
      OWNED: candidate actively drove the resolution.
      SHARED: candidate participated in a team resolution.
      PASSIVE: problem was addressed by others or circumstances; candidate describes being affected by the resolution rather than causing it.
      Return exactly one word: owned, shared, or passive."

F4. Outcome clarity
    Extraction prompt: "Is there a clear, specific outcome described?
      CONCRETE: specific result with detail (what shipped, what changed, what the measurable effect was).
      VAGUE: outcome referenced but without specifics.
      MISSING: no clear outcome described.
      Return exactly one word: concrete, vague, or missing."

F5. Attribution pattern
    Extraction prompt: "How does the candidate attribute the cause of the problem?
      INTERNAL: attributes significant contributing factors to own decisions or actions.
      MIXED: balanced attribution between self and external factors.
      EXTERNAL: attributes cause primarily to others or circumstances.
      Return exactly one word: internal, mixed, or external."
```

**Dimension signal rules:**

```
Conscientiousness signal:
  strong_positive  if F1=high AND F4=concrete AND F2≥medium AND F3=owned
  moderate_positive if F1=high AND F4≥vague AND F2≥medium
  mixed            if F1=medium OR F4=vague
  limited_signal   if F1=low OR F4=missing OR response below minimum length

Composure signal (secondary, contributes to cross-item aggregation):
  positive_contribution if F3=owned AND F5 in [internal, mixed]
  neutral_contribution  if F3=shared
  negative_contribution if F3=passive AND F5=external
```

**Reviewer-facing excerpt rule:** For each dimension signal, surface the 1–2 sentences of the response that drove the rating, plus the feature values.

---

### Item C-S2 — Honesty-Humility (primary) / Composure (secondary)

**Item type:** `star_behavioral`
**Layer:** `core`
**Construct (primary):** `honesty_humility`
**Construct (secondary):** `composure`

**Prompt shown to candidate:**
> Describe a time in the last year or two when you realized you had made a significant mistake at work — one that affected other people. How did you recognize it, what did you do next, and what did you learn?
>
> *The more specific you can be, the more useful your answer will be.*

**Expected response time:** 4–6 minutes
**Minimum response length before scoring:** 150 characters

**Rubric features:**

```
F1. Mistake genuineness
    Extraction prompt: "Evaluate whether the response describes a genuine, substantive mistake.
      GENUINE: a real, non-trivial error with clear negative consequences for others, owned by the candidate.
      MINOR_OR_RESHAPED: a small mistake, or an event reframed as a mistake that doesn't really read as one (e.g., 'I worked too hard').
      AVOIDED: the response does not describe an actual mistake; redirects to a neutral or positive story.
      Return exactly one word: genuine, minor_or_reshaped, or avoided."

F2. Ownership
    Extraction prompt: "How does the candidate attribute responsibility for the mistake?
      OWNED: explicit, first-person ownership of the error without significant externalization.
      PARTIAL: mixed ownership with meaningful externalization of blame.
      EXTERNALIZED: primary blame placed on others, circumstances, or systems.
      Return exactly one word: owned, partial, or externalized."

F3. Disclosure behavior
    Extraction prompt: "Did the candidate proactively disclose the mistake to affected parties?
      PROACTIVE: candidate raised the issue before it was discovered by others.
      REACTIVE: candidate acknowledged when asked or when it surfaced.
      CONCEALED_OR_UNCLEAR: candidate did not disclose, or disclosure behavior is unclear from the response.
      Return exactly one word: proactive, reactive, or concealed_or_unclear."

F4. Correction action
    Extraction prompt: "What did the candidate do to address the mistake?
      SUBSTANTIVE: specific actions to fix, mitigate harm, or prevent recurrence.
      NOMINAL: acknowledgment or apology without meaningful corrective action described.
      ABSENT: no correction described.
      Return exactly one word: substantive, nominal, or absent."

F5. Reflection quality
    Extraction prompt: "Does the candidate describe genuine learning or updated behavior?
      GENUINE: specific shift in approach, belief, or behavior tied to the mistake.
      GENERIC: generic lesson ('I learned to communicate more') without specific behavioral shift.
      ABSENT: no reflection on what was learned.
      Return exactly one word: genuine, generic, or absent."
```

**Dimension signal rules:**

```
Honesty-Humility signal:
  strong_positive  if F1=genuine AND F2=owned AND F3=proactive AND F4=substantive
  moderate_positive if F1=genuine AND F2 in [owned, partial] AND F4 in [substantive, nominal]
  mixed            if F1=minor_or_reshaped OR F2=externalized
  concern_flag     if F1=avoided (surface to reviewer: candidate declined to describe a real mistake)
  limited_signal   if response below minimum length

Composure signal (secondary):
  positive_contribution if F1=genuine AND the response tone describes composed handling rather than panic/avoidance
  (rubric for tone to be added post-pilot; too subjective for v1 extraction)
```

---

### Item C-S3 — Learning Orientation (primary) / Interpersonal (secondary)

**Item type:** `star_behavioral`
**Layer:** `core`
**Construct (primary):** `learning`
**Construct (secondary):** `interpersonal`

**Prompt shown to candidate:**
> Describe a specific time when someone you worked with pushed back on something you believed was right, and you ended up genuinely changing your mind. What did they say, and what actually shifted for you?

**Expected response time:** 3–5 minutes
**Minimum response length before scoring:** 120 characters

**Rubric features:**

```
F1. Specificity of original view
    HIGH: original belief is described with specifics (what the candidate thought and why).
    MEDIUM: belief referenced but abstract.
    LOW: original belief not meaningfully described.

F2. Specificity of counterargument
    HIGH: what the other person said is described with specifics.
    MEDIUM: referenced abstractly.
    LOW: not meaningfully described.

F3. Nature of shift
    SUBSTANTIVE: genuine change in belief or model, not just behavior.
    TACTICAL: change in approach but not underlying belief.
    PERFORMATIVE: response describes having "learned something" without evidence of real update.

F4. Interpersonal handling
    CONSTRUCTIVE: candidate describes engaging with the pushback without defensiveness.
    NEUTRAL: handling not clearly described.
    DEFENSIVE_INITIAL: candidate describes initial defensiveness followed by update (this is normal and honest; should not be penalized).
```

**Dimension signal rules:**

```
Learning Orientation signal:
  strong_positive  if F1=high AND F2=high AND F3=substantive
  moderate_positive if F1≥medium AND F2≥medium AND F3 in [substantive, tactical]
  mixed            if F3=performative
  limited_signal   if F1=low OR F2=low

Interpersonal Style (secondary): descriptive, not scored — surface F4 value to reviewer.
```

**Reviewer note to surface:** Candidates who describe initial defensiveness followed by genuine update often score higher on honesty-humility than candidates who describe seamless acceptance of counterargument.

---

### Item C-S4 — Interpersonal Style (primary) / Composure (secondary)

**Item type:** `star_behavioral`
**Layer:** `core`
**Construct (primary):** `interpersonal`
**Construct (secondary):** `composure`

**Prompt shown to candidate:**
> Tell me about a time you had to deliver feedback to someone — a peer, a report, or a manager — that you knew they wouldn't want to hear. Walk me through how you approached it, what you actually said, and what happened afterward.

**Expected response time:** 3–5 minutes
**Minimum response length before scoring:** 150 characters

**Rubric features:**

```
F1. Whether hard feedback was actually delivered
    DELIVERED: candidate clearly delivered the difficult message.
    SOFTENED: candidate describes delivering a diluted version of the message.
    AVOIDED: candidate ultimately did not deliver the feedback.

F2. Preparation
    DELIBERATE: candidate describes specific preparation (thinking through framing, picking time/place).
    MINIMAL: feedback given without described preparation.
    UNCLEAR.

F3. Directness of language described
    DIRECT: candidate describes specific, direct language used.
    HEDGED: describes indirect or heavily hedged language.
    UNCLEAR.

F4. Follow-through
    TRACKED: candidate describes tracking or following up on the feedback's impact.
    ABSENT: no follow-through described.

F5. Tone about the other person
    RESPECTFUL: candidate describes the recipient without denigration.
    DISMISSIVE: candidate describes the recipient in dismissive or contemptuous terms.
    DEFENSIVE_ABOUT_SELF: candidate's framing is primarily defensive about their own reputation.
```

**Dimension signal rules:**

```
Interpersonal Style — reported as profile (not band), populated by:
  direct_vs_indirect: F3
  conflict_approach: combination of F1 and F2
  follow_through: F4
  regard_for_others: F5

Composure signal (secondary):
  positive_contribution if F1=delivered AND F5=respectful
  concern_flag         if F5=dismissive OR F5=defensive_about_self

Honesty-Humility (tertiary contribution):
  positive_contribution if F1=delivered AND F3=direct
  concern_flag         if F1=avoided AND candidate frames this as "took the high road" rather than acknowledging avoidance
```

---

## Forced-Choice Pairs (13 items)

**Format:** "Which is more like you?" — two statements, candidate picks one. Scoring is deterministic option-mapping (no LLM needed).

**Scoring note:** At v1, these are tallied per dimension across the 13 pairs to produce a within-candidate rank order of construct preferences. Cross-candidate percentiles require Thurstonian IRT and are deferred to v1.1 (see spec §5.3).

**Pre-launch calibration requirement:** Each pair must pass desirability-equivalence testing (see "Known limitations" at top of this doc).

---

### Pair C-F1 — Conscientiousness vs. Learning Orientation

> **Which is more like you?**
> ☐ I stick with what I commit to, even when it stops being the most interesting thing on my plate.
> ☐ I stay alert to better approaches, even if it means rethinking what I committed to.

**Option mapping:** A → conscientiousness (+1). B → learning (+1).

---

### Pair C-F2 — Honesty-Humility vs. Interpersonal (warmth)

> **Which is more like you?**
> ☐ I tell people the truth even when it makes the conversation harder.
> ☐ I pay close attention to how I'm making people feel in a conversation.

**Option mapping:** A → honesty_humility (+1). B → interpersonal_warmth (+1).

---

### Pair C-F3 — Composure vs. Learning Orientation

> **Which is more like you?**
> ☐ When things go sideways, I stay level and work the problem.
> ☐ When things go sideways, I step back and ask what the situation is teaching me.

**Option mapping:** A → composure (+1). B → learning (+1).

---

### Pair C-F4 — Conscientiousness vs. Motivation (autonomy)

> **I do my best work when:**
> ☐ I have clear structure and clear expectations.
> ☐ I have space to figure out my own approach.

**Option mapping:** A → conscientiousness (+1, structure-oriented facet). B → motivation_autonomy (+1).

---

### Pair C-F5 — Honesty-Humility vs. Conscientiousness (delivery)

> **Which is more like you?**
> ☐ I'd rather miss a deadline than ship work I'm not confident in.
> ☐ I'd rather ship on time and fix what's imperfect afterward.

**Option mapping:** A → honesty_humility (+1) + quality-orientation note. B → conscientiousness (+1, commitment-facet).
**Reviewer note:** This pair is genuinely ambiguous in interpretation. Both options are defensible; the signal is in the pattern across multiple pairs, not this one in isolation.

---

### Pair C-F6 — Learning Orientation vs. Interpersonal (support)

> **Which is more like you?**
> ☐ I seek out people who will tell me when I'm wrong.
> ☐ I seek out people who will help me do my best work.

**Option mapping:** A → learning (+1). B → interpersonal_support_seeking (+1).

---

### Pair C-F7 — Motivation (mission) vs. Motivation (scope)

> **What draws you more to a role?**
> ☐ Work that matters to the world.
> ☐ Work where I can take on substantial responsibility.

**Option mapping:** A → motivation_mission (+1). B → motivation_scope (+1).
**Note:** This pair contributes only to the Motivation profile, not to any band estimate.

---

### Pair C-F8 — Conscientiousness vs. Interpersonal (agreeableness)

> **Which is more like you?**
> ☐ I'll push back on a plan I think is flawed, even when the room seems aligned.
> ☐ I work to find the version of a plan everyone can get behind.

**Option mapping:** A → conscientiousness (+1, quality-facet) + interpersonal_directness. B → interpersonal_agreeableness (+1).

---

### Pair C-F9 — Honesty-Humility vs. Motivation (recognition)

> **Which is more like you?**
> ☐ I prefer to let my work speak for itself.
> ☐ I believe in advocating clearly for the work I've done.

**Option mapping:** A → honesty_humility (+1, modesty-facet). B → motivation_recognition (+1).
**Reviewer note:** Do not read A as universally better. In many roles, B is essential. This pair is profile-informative, not evaluative.

---

### Pair C-F10 — Composure vs. Conscientiousness (focus)

> **Which is more like you?**
> ☐ I can hold multiple priorities in the air without it getting to me.
> ☐ I do my best work when each priority gets my full attention, one at a time.

**Option mapping:** A → composure (+1). B → conscientiousness (+1, focus-facet).

---

### Pair C-F11 — Learning Orientation vs. Conscientiousness (mastery)

> **Which is more like you?**
> ☐ I'd rather try something new and get it 80% right.
> ☐ I'd rather do something familiar and get it fully right.

**Option mapping:** A → learning (+1). B → conscientiousness (+1, mastery-facet).

---

### Pair C-F12 — Honesty-Humility vs. Interpersonal (dominance)

> **Which is more like you?**
> ☐ I'll acknowledge uncertainty in my view, even in a room of people with strong opinions.
> ☐ I'll state my view with conviction, even in a room of people with strong opinions.

**Option mapping:** A → honesty_humility (+1, modesty-facet). B → interpersonal_dominance (+1).

---

### Pair C-F13 — Motivation (autonomy) vs. Motivation (stability)

> **What's more important to you in your next role?**
> ☐ Real autonomy over how I operate.
> ☐ Stability and predictability I can count on.

**Option mapping:** A → motivation_autonomy (+1). B → motivation_stability (+1).

---

## Tradeoff Items (2)

### Item C-T1 — Motivational Drivers (ranked)

**Item type:** `tradeoff`
**Layer:** `core`
**Construct:** `motivation`
**Format:** Drag-to-rank (or numbered selection)

**Prompt shown to candidate:**
> Imagine you had to choose between four roles. Compensation and title are identical. Rank these in the order you'd actually pick them — most preferred first:
>
> - **Autonomy** — high control over how you operate day to day
> - **Mission** — work that directly connects to something you care about
> - **Scope** — substantial responsibility and influence
> - **Stability** — a predictable, low-volatility environment

**Scoring:** Rank contributes to the Motivational Drivers profile. No band estimate; this is profile data used by reviewers to assess role-fit and by follow-up question generation.

**Reviewer-facing output:** Candidate's top-two motivators and bottom motivator are surfaced in the Motivation section of the report, along with the full ranking.

---

### Item C-T2 — Honesty-Humility (scenario)

**Item type:** `tradeoff`
**Layer:** `core`
**Construct (primary):** `honesty_humility`
**Construct (secondary):** `conscientiousness`

**Prompt shown to candidate:**
> You've been working on a piece of analysis for three weeks. The night before you're supposed to share it with your team, you realize there's a significant flaw in the reasoning — one that probably won't be caught by anyone else in the meeting. Fixing it properly would take another week.
>
> What would you most likely do?
>
> ☐ **A.** Share it tomorrow as planned, flag the flaw clearly in the meeting, and ask for time to fix it.
> ☐ **B.** Delay the meeting, take the week to fix it, and share the corrected version.
> ☐ **C.** Share it tomorrow as planned, fix the flaw quietly afterward, and move on.
> ☐ **D.** Share it tomorrow as planned and mention the flaw only if someone asks.

**Scoring:**

```
Option A: honesty_humility +2, conscientiousness_commitment +1 (owns flaw publicly, preserves commitment)
Option B: honesty_humility +1, conscientiousness_commitment -1 (fixes it, but breaks commitment)
Option C: honesty_humility -1 (addresses flaw but not transparently)
Option D: honesty_humility -2 (conceals unless asked)
```

**Reviewer note to surface alongside this item:**
> This item is face-valid — candidates can see what the "right" answer is. Signal is weakest on this item in isolation. It is useful primarily in combination with forced-choice pair C-F5 and C-F12, and STAR item C-S2. Divergence between C-T2 response and the pattern across those items is the real signal.

---

## Consistency Checks (2)

Consistency checks probe the same underlying construct as an earlier item, in different surface form. Divergence is flagged for reviewer attention but does not automatically penalize — some divergence reflects honest contextual variation.

---

### Item C-CC1 — Conscientiousness (paired with C-F1)

**Item type:** `consistency_check`
**Layer:** `core`
**Construct:** `conscientiousness`
**Placement:** late in flow, several items after C-F1

**Prompt shown to candidate:**
> How much do you agree with this statement?
>
> *"I sometimes leave tasks unfinished when I lose interest in them."*
>
> ☐ Strongly disagree
> ☐ Disagree
> ☐ Neither
> ☐ Agree
> ☐ Strongly agree

**Consistency rule:**

```
Flag for reviewer if:
  (C-F1 response = A "sticks with commitments") AND (C-CC1 ≥ "Agree")
OR
  (C-F1 response = B "rethinks what was committed") AND (C-CC1 ≤ "Disagree")

Flag text: "Candidate's forced-choice response on commitment/follow-through diverged
from their direct self-report on leaving tasks unfinished. Worth probing in interview."
```

---

### Item C-CC2 — Honesty-Humility (paired with C-F12 and C-S2)

**Item type:** `consistency_check`
**Layer:** `core`
**Construct:** `honesty_humility`
**Placement:** late in flow

**Prompt shown to candidate:**
> How much do you agree with this statement?
>
> *"I sometimes present my work as more complete or polished than it actually is, to get buy-in from others."*
>
> ☐ Strongly disagree
> ☐ Disagree
> ☐ Neither
> ☐ Agree
> ☐ Strongly agree

**Consistency rule:**

```
This item has two functions:

1. Self-report honesty-humility signal in its own right.
   Candidates who endorse "Agree" or "Strongly agree" are displaying a form of
   honesty-humility (willingness to acknowledge self-presentation behavior). This is
   counterintuitive and should be treated as positive signal, not negative.
   Counterintuitive scoring is NOT disclosed to candidates.

2. Consistency check against C-F12 and C-T2.
   Flag for reviewer if:
     (C-F12 response = A "acknowledge uncertainty") AND (C-CC2 = "Strongly disagree")
     AND (C-T2 response in [C, D])
   This pattern suggests consistent self-presentation management across the instrument.

Flag text: "Candidate's pattern across honesty-humility items suggests strong
self-presentation management. Not disqualifying; recommend probing specific examples
of mistakes or uncertainty in interview."
```

**Important:** Do not label this item as a consistency check to the candidate. It is embedded as a regular item.

---

## Closing Reflection (unscored)

### Item C-R1

**Item type:** `reflection`
**Layer:** `core`
**Scored:** No (qualitative color for reviewer and source for follow-up generation)

**Prompt shown to candidate:**
> If a close colleague from a previous role were describing how you work, what are two things they'd likely mention — one that you're proud of, and one that you're still actively working on?

**Handling:**
- Response is surfaced in the reviewer report as "Candidate's self-reflection" with the text verbatim.
- Response is used as input to follow-up interview question generation (e.g., the "working on" item can seed a behavioral follow-up).
- Does NOT contribute to any dimension band estimate.

---

## Cross-item scoring notes

### How dimension bands are produced

For each of the six dimensions, aggregate signal across items per the rules in the spec (§5.2). Concretely for the core block:

```
Conscientiousness evidence sources:
  C-S1 (primary, rich signal)
  C-F1, C-F4, C-F5, C-F8, C-F10, C-F11 (forced-choice tallies)
  C-CC1 (consistency check)
  C-T2 (secondary contribution)

Honesty-Humility evidence sources:
  C-S2 (primary, rich signal)
  C-F2, C-F5, C-F9, C-F12 (forced-choice tallies)
  C-CC2 (self-report + consistency)
  C-T2 (scenario-based signal)

Composure evidence sources:
  C-S1 (secondary)
  C-S2 (secondary)
  C-S4 (secondary)
  C-F3, C-F10 (forced-choice tallies)

Learning Orientation evidence sources:
  C-S3 (primary, rich signal)
  C-F1, C-F3, C-F6, C-F11 (forced-choice tallies)

Interpersonal Style evidence sources:
  C-S3 (secondary)
  C-S4 (primary, rich signal — reported as profile)
  C-F2, C-F6, C-F8, C-F9, C-F12 (forced-choice tallies — profile contributions)

Motivational Drivers evidence sources:
  C-T1 (primary, ranked motivators)
  C-F4, C-F7, C-F9, C-F13 (forced-choice tallies — profile contributions)
  Reported as profile (top motivators, bottom motivators)
```

### Minimum evidence threshold

Per spec §5.5, a dimension returns `insufficient_signal` if fewer than 2 independent items contribute. All six dimensions meet this threshold from the core block alone; role-family items add further evidence.

### Expected output per candidate from the core block

- 4 dimensions with band estimates (Conscientiousness, Honesty-Humility, Composure, Learning)
- 2 dimensions as profiles (Interpersonal Style, Motivational Drivers)
- 0–2 consistency flags
- 2–4 suggested follow-up interview questions (generated from STAR responses and any flags)
- Raw responses available on request

---

## What needs to happen before production

1. **Psychology review** of all items for construct validity, ADA sensitivity, and cultural appropriateness.
2. **Desirability calibration** of forced-choice pairs (small study per pair).
3. **Rubric piloting** on ~20–50 real responses per STAR item; iterate rubric prompts until inter-rater agreement (LLM vs. human rater) exceeds an agreed threshold.
4. **Flow piloting** on ~30 internal or friendly-customer candidates; measure completion rate, drop-off points, time taken.
5. **Legal review** of consent language, data handling, and jurisdictional compliance.
6. **Role-family library** drafted for at least one role family before first customer deployment.

---

*End of core items v1 draft.*
