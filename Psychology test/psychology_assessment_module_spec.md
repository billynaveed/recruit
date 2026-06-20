# Psychology Assessment Module — Product & Engineering Spec

---

## READ THIS FIRST — Process, Scope, and Deferred Decisions

**This section exists so psychology reviewers can see the full picture before reading the spec.**

### What this document is
A build spec for the psychology-question component of a candidate assessment product. It is intended to be handed directly to engineering (including AI coding tools) as the source of truth.

### Who built this and how
This spec was developed through iterative discussion between the founder (non-psychologist) and an AI assistant. It draws on established I/O psychology literature and known legal/regulatory constraints, but **has not yet been reviewed by a trained psychologist or I/O professional**. That review is the purpose of circulating this document.

### Guiding frame
This module is a *structured listening tool*. It helps a reviewer ask better interview questions and notice patterns they might miss. It is a decision aid, **not a decision-maker**. Every design choice serves that frame.

### What we have deliberately chosen to do
1. Anchor on Big Five + HEXACO Honesty-Humility as the construct foundation, because these have the strongest replication and predictive-validity evidence in the I/O literature.
2. Use six dimensions rather than ten or twelve. Fewer, well-measured dimensions beat more, poorly-measured ones.
3. Weight the instrument heavily toward **multidimensional forced-choice** items because they are the most resistant to both human faking and AI-assisted answering.
4. Require human-in-the-loop for all employment decisions. No autonomous rejection.
5. Report results as **ordered bands with confidence indicators**, not numerical scores. Numbers imply precision we have not earned.
6. Build evidence-traceability into every output claim — any reviewer must be able to see which items drove any conclusion.

### What we have deliberately chosen NOT to do
1. No MBTI, DISC, Enneagram, or type-based frameworks — insufficient psychometric validity.
2. No Dark Triad scoring — legal and ethical risk in hiring contexts.
3. No "culture fit" scoring — vague enough to absorb bias, specific enough in consequence to act on it.
4. No LLM inference of personality from video, voice, or free-form prose — weak evidence base, severe adverse-impact risk.
5. No composite "overall score" or hire/no-hire output.
6. No standalone Grit dimension — largely Conscientiousness rebranded (Credé, Tynan & Harms 2017 meta-analysis).
7. No clinical or mental-health-adjacent inference.

### Trade-offs we have agreed to defer (for psychologist review)
These are real trade-offs. The founder has agreed to defer them knowingly. Reviewers should tell us if any of these are wrong calls.

1. **Thurstonian IRT scoring for forced-choice (DEFERRED to v1.1).**
   Without it, forced-choice results are reported as *within-candidate rank orders* ("Conscientiousness is this candidate's strongest signal among the six dimensions") rather than *cross-candidate percentiles* ("top 20% on Conscientiousness"). This is a real limitation; we are accepting it to ship v1 faster and to collect response data that will be needed to calibrate the IRT model anyway.

2. **Own-data predictive validation (DEFERRED to post-launch).**
   The instrument is built on established constructs but has not been validated against performance outcomes on our own candidate population. Until it is, we cannot make predictive-validity claims. This affects marketing copy and customer representations, not the instrument design itself.

3. **Multi-language support (DEFERRED to v1.2+).**
   v1 is English-only. This is an adverse-impact risk for non-native English speakers, especially on open-ended items where scoring rubrics reward specificity and fluency. Mitigation at v1: explicit flagging of short or low-fluency responses for human review rather than automatic penalization.

4. **I/O psychologist on staff or retainer (NOT YET COMMITTED).**
   Item quality is capped by who writes items. The founder acknowledges this is the single highest-leverage addition and will be addressed before scaling the item library.

5. **Third-party bias audit (PLANNED, not yet scheduled).**
   Required for NYC Local Law 144 compliance. Recommended as good practice regardless. Target: within 6 months of first production use.

### What reviewers are asked to evaluate
- Is the construct selection defensible?
- Are there items or dimensions that cross into ADA-sensitive or legally risky territory?
- Are the anti-faking measures (forced-choice weighting, triangulation, consistency checks) sufficient?
- Is the reporting format (bands, confidence, evidence-traceability) intellectually honest?
- Are the deferred trade-offs above acceptable for a v1 launch, or is any of them a must-have-before-launch?
- What else is missing?

### Annotation convention used throughout
Every structural element is annotated with its configuration status:

- 🔒 **FIXED** — identical for every candidate across every role. Not configurable.
- 🔧 **BUNDLED** — varies by pre-configured role family + seniority bundle. Configured by admin, not per-recruiter.
- ⚙️ **SWAPPABLE** — recruiter may swap within tightly constrained options (e.g., replace an SJT with another SJT tagged to the same role family and construct).

If an element has no annotation, it is FIXED by default.

---

## 1. Objective and Non-Goals 🔒

### 1.1 What the module does
Produce structured, probabilistic signal about a candidate's behavioral tendencies, work style, motivation, and judgment, at a confidence level a thoughtful human reviewer can act on. Output should reduce reviewer cognitive load, surface patterns a resume scan misses, and generate role-calibrated follow-up interview questions.

### 1.2 What the module does not do
- Does not diagnose, screen for, or infer mental health status
- Does not produce scalar "culture fit," "founder potential," or "hireability" scores
- Does not issue hire/no-hire recommendations
- Does not replace structured interviews
- Does not claim psychometric precision it has not validated
- Does not operate autonomously on employment-consequential decisions

### 1.3 Design tests (every feature must pass)
1. Would a reviewer with psychology training see this as rigorous?
2. Is every output claim traceable to specific items?
3. Does this degrade gracefully under candidate gaming and AI-assisted responding?
4. Is this defensible under EU AI Act, EEOC, NYC Local Law 144, ADA, and GDPR Art. 22?

---

## 2. Dimensional Model 🔒

Six dimensions. All fixed across every candidate and role. What changes by role is which SJTs and behavioral items probe them, not the dimensions themselves.

| Dimension | Construct basis | Why it matters | Reporting form |
|---|---|---|---|
| Conscientiousness / Reliability | Big Five C (industriousness, orderliness, self-discipline facets) | Most consistent cross-role predictor of performance | Band estimate |
| Honesty-Humility / Integrity | HEXACO H | Predicts counterproductive work behavior and ethical lapses better than any Big Five trait | Band estimate |
| Composure Under Pressure | Big Five Emotional Stability, scoped to observable work behavior only | Predicts performance under stress | Band estimate |
| Learning Orientation | Big Five Openness, intellect facet; update/revision behavior | Predicts adaptability in novel roles | Band estimate |
| Interpersonal Style | Big Five Agreeableness + dominance; role-contingent | How candidate functions with peers, reports, managers, clients | **Profile, not scalar** |
| Motivational Drivers | Tradeoff-revealed preferences, not endorsed values | Predicts retention, engagement, tradeoff behavior | Profile |

**Explicitly excluded as scored dimensions:**
Grit, growth mindset, Dark Triad, "leadership" as standalone, "culture fit."

---

## 3. Instrument Architecture

### 3.1 Three-layer structure

- **Layer 1 — Core block 🔒 FIXED** (for all candidates, ~60% of instrument). Measures dimensions with broad cross-role validity. Fixed items allow cross-candidate comparability over time.
- **Layer 2 — Role-family block 🔧 BUNDLED** (library-pulled, ~30%). Same constructs, role-calibrated items. Primarily SJTs and interpersonal-style items.
- **Layer 3 — Role-specific block 🔧 BUNDLED** (library-pulled, ~10%). One or two items from the actual work.

### 3.2 Item counts and timing

Target: ~25 items, 25–30 minutes total.

| Block | Item type | Count | Config status |
|---|---|---|---|
| Core | STAR behavioral (open-ended) | 4 | 🔒 FIXED |
| Core | Forced-choice pairs (MFC) | 12–14 | 🔒 FIXED |
| Core | Tradeoff items (generic motivation) | 2 | 🔒 FIXED |
| Core | Embedded consistency checks | 2 | 🔒 FIXED |
| Core | Closing reflection (unscored) | 1 | 🔒 FIXED |
| Role-family | SJT scenarios | 2–3 | 🔧 BUNDLED / ⚙️ SWAPPABLE |
| Role-family | STAR behavioral (role-calibrated) | 1–2 | 🔧 BUNDLED / ⚙️ SWAPPABLE |
| Role-family | Tradeoff (role-specific tension) | 1 | 🔧 BUNDLED |
| Role-specific | SJT or micro-work-sample | 1 | 🔧 BUNDLED |
| **Total** | | **~25** | |

### 3.3 Why forced-choice is weighted heavily
Forced-choice (specifically **multidimensional forced-choice**, where each pair contrasts equally-desirable options from *different* dimensions) is the single most anti-faking and AI-resistant item type available. An LLM cannot meaningfully help the candidate because there is no globally "correct" option to pattern-match toward.

Open-ended items, historically the strongest evidentiary items, are now the most AI-fakeable. The instrument weights accordingly.

**Ceiling:** Above ~14 pairs, diminishing returns set in. Split into two blocks of 6–7, interleaved with other item types.

### 3.4 Library organization 🔧
Items tagged along three axes:
1. **Construct** (one of the six dimensions)
2. **Role family** (IC individual, people manager, commercial, operations, research/analytical, executive — 6–8 families max)
3. **Seniority band** (early career, mid, senior, leadership)

Every item carries all three tags plus its rubric and status (`pilot | active | retired`).

### 3.5 Bundle configuration UI 🔧 ⚙️

**Recruiter flow (drag-and-drop admin UI):**
1. Pick role family
2. Pick seniority band
3. System presents pre-configured bundle (core + role-family + role-specific)
4. Recruiter may ⚙️ swap items *within constrained rules only* — replace an SJT with another SJT tagged to the same role family, construct, and seniority
5. Recruiter may **not** hand-assemble arbitrary item sets from the library

Critical distinction: curated bundles preserve construct coverage. Free assembly destroys it.

**Library target at launch:** 60–100 items across 6 families × 3–4 seniority bands.

---

## 4. Item Schema (Data Model)

```
Item {
  id: string (stable, versioned)
  version: int
  status: enum [pilot, active, retired]
  construct: enum [conscientiousness, honesty_humility, composure, learning, interpersonal, motivation]
  item_type: enum [star_behavioral, sjt, forced_choice_pair, tradeoff, reflection, consistency_check]
  layer: enum [core, role_family, role_specific]
  role_families: array<enum> | null    // null for core items (core = all roles)
  seniority_bands: array<enum> | null  // null for core items
  body: string                         // prompt candidate sees
  options: array<Option> | null        // for SJT, forced-choice, tradeoff
  rubric: Rubric
  expected_response_time_seconds: int
  metadata: {
    author, reviewed_by, created_at, response_count, flagged_for_review
  }
}

Option {
  id: string
  text: string
  construct_tag: enum | null           // for MFC: which dimension this option loads on
  polarity: enum [positive, negative, neutral]
}

Rubric {
  scoring_method: enum [feature_extraction, option_mapping, ranking]
  features: array<Feature>             // for open-ended items
  option_mappings: map<option_id, score_contribution>  // for forced-choice/SJT
  confidence_signals: array<ConfidenceSignal>
}

Feature {
  name: string                         // e.g., "specificity", "first_person_agency"
  description: string
  dimension_contribution: map<construct, weight>
  extraction_prompt: string            // LLM rubric prompt for open-ended scoring
}
```

### 4.1 Bundle Schema 🔧

```
Bundle {
  id: string
  role_family: enum
  seniority_band: enum
  core_items: array<item_id>           // 🔒 FIXED for all bundles
  role_family_items: array<item_id>    // 🔧 configured per bundle
  role_specific_items: array<item_id>  // 🔧 configured per bundle
  swappable_slots: array<SwapConstraint>  // ⚙️ defines what recruiters may swap
}

SwapConstraint {
  slot_id: string
  original_item_id: string
  allowed_replacements: filter<construct, item_type, role_family, seniority_band>
}
```

---

## 5. Scoring Pipeline

**Plain-English summary:** Scoring is a mix of simple math (on structured inputs) and LLM-based rubric scoring (on free-text responses). Roughly 60% of the pipeline is deterministic math; 40% uses an LLM.

### 5.1 What is math vs. what needs an LLM

**Deterministic math only — no LLM needed:**
- Forced-choice pairs: candidate picks an option → option has pre-assigned dimension tag → tally per dimension
- Tradeoff items: pre-assigned mappings → tally
- SJTs with ranked/selected options: pre-assigned scoring key → tally
- Consistency checks: compare paired items → flag divergence above threshold
- Response-time and length observations: arithmetic
- Band estimate assignment: rule-based thresholds on the tallied inputs

**Requires LLM with rubric prompts:**
- STAR behavioral open-ended responses: rubric-based judgment on free text (did candidate describe a specific situation, take personal agency, mention an artifact, describe an outcome, reflect meaningfully)
- Closing reflection item (qualitative summary)
- Generating personalized follow-up interview questions
- Writing dimension summaries in evidence-referencing language

**Build order recommendation:** Build the deterministic math first — it works immediately and reliably. Add LLM-based rubric scoring second, isolated behind a clear interface, with versioned prompts and locked model versions. Bugs hide in the LLM layer; isolation makes them easier to find and fix.

### 5.2 Architecture (four layers, each inspectable)

**Layer 1 — Item-level feature extraction.**
- Forced-choice/SJT/tradeoff: deterministic math (§5.1)
- Open-ended: LLM rubric scoring against explicit features
- Every score traces to rubric; rubric is versioned product artifact

**Layer 2 — Dimension estimates with uncertainty.**
Per dimension, produce a *band estimate* (5 ordered bands):
- `limited_signal`
- `mixed`
- `moderate_positive`
- `strong_positive`
- `unusually_strong`

Per dimension, produce a confidence indicator driven by:
- Volume of converging evidence across item types
- Specificity and quality of open-ended responses
- Consistency across consistency-check items
- Response-time outliers

**No point scores. No 0–100 scales. No decimals.**

**Layer 3 — Pattern-level summaries.**
- **Strengths:** dimensions where multiple item types converge on strong positive signal
- **Concerns:** dimensions where multiple item types converge on negative or ambiguous signal, or where inconsistencies suggest gaming
- **Contradictions:** explicit list of response divergences (do not interpret; surface for reviewer)
- **Open questions:** dimensions with insufficient signal to form a band

**Layer 4 — Follow-up interview questions.**
For each concern, contradiction, and open question: generate 1–2 specific follow-ups grounded in the candidate's actual responses.

### 5.3 Forced-choice scoring at v1 (DEFERRED decision)
At v1, forced-choice uses **simple tallying** (within-candidate rank ordering): across all pairs, count how often each dimension is chosen, producing a rank order per candidate. Reviewers see "this candidate's forced-choice responses most strongly favored Conscientiousness and Honesty-Humility."

Thurstonian IRT scoring (enabling cross-candidate percentiles on forced-choice) is deferred to v1.1 pending accumulated response data. This limits cross-candidate comparability on the forced-choice portion at v1; cross-candidate signal at v1 comes primarily from STAR behavioral and SJT rubric scoring.

### 5.4 Prohibited scoring outputs 🔒
- Composite scores across dimensions
- Hire/no-hire recommendations
- Clinical-sounding descriptors ("narcissistic," "anxious," "depressive")
- Inferred traits outside the six-dimension model
- Personality profiles extrapolated beyond evidence
- Demographic inference (age, gender, ethnicity, sexuality, disability status, religion, nationality)
- Inferences about non-work domains

### 5.5 Anti-overfitting rules (enforce in code) 🔒
- Do not produce a band estimate for a dimension with fewer than 2 independent items supporting it → return `insufficient_signal`
- Flag scoring drift: if scores correlate > 0.3 with response length, vocabulary complexity, or completion time, the scorer is miscalibrated
- Log item-to-score traceability for every dimension estimate
- **Lock LLM model version per rubric version.** When model versions change, re-test rubric outputs before promoting to production.

---

## 6. Reviewer Output Format 🔒

Four tiers, collapsible, progressive disclosure. Fixed across all candidates and roles.

### 6.1 Tier 1 — "60-second panel" (top of report)
- 3–5 bullet-length strengths, each tagged to a dimension
- 2–4 concerns or open questions, each tagged to a dimension
- 2–3 suggested follow-up interview questions in natural interviewer voice
- Overall assessment confidence: `limited_signal` | `moderate_signal` | `rich_signal`
- **No overall score. No pass/fail. No composite.**

### 6.2 Tier 2 — Dimension cards (6 expandable cards)
Each card:
- Dimension name and band estimate
- Confidence indicator for this dimension
- 2–3 sentence summary in evidence-referencing language
- Inspectable list of items and response excerpts that drove the estimate
- 1–2 follow-up interview questions tied to this dimension and this candidate's responses

### 6.3 Tier 3 — Patterns
- **Contradictions panel:** response divergences with excerpts, unedited
- **Response style observations:** length, specificity, first-person agency, attribution patterns — descriptive, not evaluative
- **Consistency check results:** pass / divergence flagged, with relevant items

### 6.4 Tier 4 — Raw responses
Full response text accessible to reviewers. Non-negotiable.

### 6.5 Standing footer (always visible)
> This report is a structured summary of a short assessment. It is not a psychological evaluation. Use alongside, not in place of, interviews and work samples.

### 6.6 UI anti-patterns to avoid
- Radar charts with filled axes (implies precision)
- Colorful personality-type labels ("Driver," "Collaborator")
- One-line character summaries
- Single overall score widget
- Percentile displays without context
- Any visualization resembling a horoscope

---

## 7. Candidate Experience 🔒

### 7.1 Flow structure
1. **Consent & transparency screen**: what's collected, how used, who sees it, retention, rights to deletion and human review. Legal baseline + trust lever.
2. **Intro**: what this is, what it is not, approximate duration, "no right answers" framing.
3. **Warm-up STAR** (1 item): moderate-stakes, low-anxiety.
4. **Mixed core block**: interleaved SJTs, behavioral, forced-choice (split into two blocks of 6–7).
5. **Role-family block** 🔧: SJTs and behavioral items.
6. **Tradeoffs and motivational block**: late in flow, when candidate is warmed up.
7. **Closing reflection**: one low-stakes item.
8. **Summary screen**: thank, confirm next steps.

### 7.2 Pacing rules
- One item per screen for open-ended and SJT
- 2–4 per screen for forced-choice
- Progress indicator always visible
- Save-and-resume supported
- Screen reader compatible

### 7.3 Fatigue mitigation
- Never more than 6–7 forced-choice pairs in a row
- Never more than 2 open-ended in a row
- Vary item types deliberately
- No long setup paragraphs

### 7.4 Anti-gaming design
- Mix self-report with behavioral and SJT
- Forced-choice uses equally-desirable options across different dimensions
- Consistency checks embedded, not labeled
- SJT options designed so "right" answer is non-obvious
- Construct names not exposed to candidates
- Extreme response-time outliers flagged for reviewer attention

### 7.5 Accessibility and legal baseline
- Screen reader support
- Reasonable accommodation contact surface
- No items probing anxiety, mood, or stress tolerance in ADA-sensitive ways
- No items asking about protected characteristics directly or by proxy

---

## 8. Operational Considerations (what happens in real use) 🔒

Each of these needs a defined rule before launch.

### 8.1 Consent and data rights
Before any item is shown, candidate sees: what is collected, purpose, who has access, retention period, how to request deletion or human review. This is a GDPR / EU AI Act requirement in Europe and good practice everywhere. Explicit transparency also reduces gaming.

### 8.2 Incomplete assessments
Drop-off in this category is typically 30–60%. Required rule: does incomplete = rejected, partial data visible to recruiter, or routed to manual fallback? **Recommended default: partial data visible with explicit "incomplete assessment" flag at top of reviewer report, no automatic rejection, ADA accommodation surface available.**

### 8.3 Retakes
Define a policy. **Recommended default: one retake permitted on request, with an elapsed-time requirement (e.g., 14 days). Both assessments visible to reviewer. No retakes after an interview has begun.**

### 8.4 Very short or low-effort responses
Needs a rule, not a judgment call. **Recommended default: open-ended items below a minimum character count (e.g., 100 chars) or flagged by rubric as "insufficient detail" do not contribute to dimension estimates; the item is flagged in the reviewer report with the raw response available.**

### 8.5 Reviewer training
Reviewers will over-rely on the output unless actively trained not to. **Required: 1-page "how to read this report" doc covering the uncertainty framing, the follow-up interview questions as the primary output, and explicit instruction that the report does not replace interviews.** Offer in-product onboarding for first-time reviewers.

### 8.6 LLM version locking
When the underlying LLM model changes (provider updates), rubric outputs can shift. **Required: each rubric version is locked to a specific model version. Changes to model version trigger a re-test protocol on a held-out sample before promotion to production. Log the model version used for every scored response.**

### 8.7 Candidate-facing output (optional feature)
Some jurisdictions give candidates the right to see what was said about them. Decide early. **Recommended default at v1: offer candidates a summary of which dimensions were probed and their rights to request human review and data deletion, but do not show dimension estimates or bands directly.**

### 8.8 Language and localization
v1 is English-only. Non-native English responses may score lower on specificity and fluency features even when underlying signal is fine. **Mitigation at v1: open-ended items tagged for "possible non-native English response" based on fluency markers in the rubric → reviewer sees this flag and is instructed to weight the open-ended portion accordingly; dimension estimate is not automatically lowered.**

### 8.9 Audit logging
**Required from day one:** every item shown, every response, every score, every reviewer action is logged with timestamps, LLM model version, rubric version, and bundle version. Retention aligned to GDPR / applicable jurisdiction rules.

### 8.10 Adverse impact monitoring
Where demographic data is lawfully available (e.g., US EEO-1 voluntary disclosure), aggregate subgroup analysis on band distributions per dimension. Flag disparities exceeding four-fifths rule thresholds for review. Do not gate individual decisions on this; use it to detect problem items.

---

## 9. Guardrails and Compliance Surface 🔒

### 9.1 Legal regimes to architect against (not retrofit)
- **EU AI Act:** hiring is explicitly high-risk. Requires risk management, data governance, transparency, human oversight, post-market monitoring.
- **NYC Local Law 144:** annual independent bias audit + candidate notice for automated employment decision tools.
- **Colorado AI Act, Illinois AI Video Interview Act:** disclosure, consent, impact assessments.
- **US Title VII / EEOC Uniform Guidelines:** adverse impact monitoring; four-fifths rule.
- **ADA:** items must not function as medical inquiries.
- **GDPR Article 22:** meaningful human-in-the-loop required for decisions with legal or similarly significant effects.

### 9.2 Architectural requirements implied
- Audit logging (§8.9)
- Versioning of items, rubrics, bundles, scoring logic — no silent production changes
- Subgroup monitoring hooks (§8.10)
- Human-in-the-loop enforcement — system cannot autonomously reject
- Candidate transparency surface (§8.1)
- Bias audit pipeline aligned to NYC Local Law 144 structure

### 9.3 Claims hygiene (marketing and product copy)
Do not claim:
- "Measures personality accurately/scientifically"
- Specific predictive validity numbers without own-data validation
- Ability to detect dishonesty or deception
- Equivalence to clinical or psychometric instruments
- Elimination of bias (reduction of some forms is achievable; elimination is not)

---

## 10. Build Sequence

### 10.1 MVP scope (first ship)
- One role family, matched to first customers (IC engineer OR commercial/sales)
- Full core block (~20 items: 4 STAR, 12–14 forced-choice, 2 tradeoff, 2 consistency, 1 reflection)
- One role-family bundle (~4–5 items)
- One role-specific item
- Full four-tier reviewer output
- Candidate flow end-to-end including consent screen
- Deterministic scoring layer (§5.1 math portion) fully working
- LLM rubric scoring layer with ≥3 piloted rubrics per STAR item
- Audit logging and versioning from day one

### 10.2 Post-MVP
- Second role family after ~200–500 responses on first family, rubrics tuned, weak items retired
- Thurstonian IRT scoring layer for forced-choice
- Subgroup monitoring dashboards
- Additional role families (target 6 at v1.0)
- Third-party bias audit (within 6 months of first production use)
- Multi-language support
- Own-data predictive validation

### 10.3 Do not build
- LLM inference of personality from video, voice, or free-form prose
- "Culture fit" scoring
- Overall composite scores or hire/no-hire outputs
- MBTI / DISC / Enneagram adaptations
- Dark Triad scoring
- Grit as a standalone dimension

---

## Appendix A — Item-writing principles

1. Tie every item to a specific construct before writing. If construct is unclear, do not ship the item.
2. Pilot every item. Most items will be mediocre; you only know which after data.
3. Avoid obvious "right answer" items. If a reasonable candidate can tell what you want to hear, the item is dead weight.
4. Role-calibrate surface content. Same construct, different items for different roles.
5. Write in natural voice. Corporate assessment voice signals low rigor.
6. ADA-audit every item. No items that read as probes into mental health, mood, or disability.
7. Version every item. Silent production edits invalidate any comparability claims.

## Appendix B — Forced-choice design rules

1. Options in a pair must be from **different dimensions** (multidimensional forced-choice).
2. Options must be calibrated for **equal social desirability**. This is what makes MFC anti-faking.
3. Pilot with desirability-rating studies before shipping; retire any pair where desirability difference exceeds threshold.
4. Never more than 6–7 consecutive forced-choice items before interleaving another type.
5. Distribute construct coverage across the block; do not cluster all honesty-humility pairs together.

## Appendix C — Glossary of constructs (for reviewer training material)

- **Conscientiousness:** tendency toward organization, reliability, self-discipline, goal-directed effort
- **Honesty-Humility:** tendency toward sincerity, fairness, modesty, low exploitativeness (HEXACO construct)
- **Composure Under Pressure:** observable behavioral response and recovery during stress, criticism, or setback
- **Learning Orientation:** openness to disconfirming information, evidence of self-directed learning, willingness to revise
- **Interpersonal Style:** patterns in how the candidate engages in disagreement, feedback, collaboration, direction-giving
- **Motivational Drivers:** tradeoff-revealed preferences across autonomy, scope, mission, stability, compensation

---

*End of spec.*
