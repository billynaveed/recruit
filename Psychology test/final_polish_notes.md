# Final polish — post-Phase 2 report review

**Context:** All phases of the reviewer rework are landed. Scoring, synthesis, patterns, strengths, interview focus, and the restructured report format are working. This document captures the remaining items worth fixing before this goes in front of the I/O psychology reviewer. Ordered by priority.

Reviewed across all 8 seeded candidates: Marcus Webb, Patricia Wu, Robert Kane, Amanda Fox, Priya Kumar, Tom Bradley, Lucy Chen, James Wong.

---

## Must-fix (credibility and compliance)

### 1. Restore the "Contributing evidence" audit trail on dimension estimates

In the previous format each dimension band had a footer like:

> *Contributing evidence: C-S3, FC (learning tally: 3/4)*

This has been removed in the new report format. The prose narrative in each dimension now implies the evidence sources, but there is no explicit traceable link from band to source.

**Why it matters:** the product's legal/compliance architecture is designed for EU AI Act high-risk hiring and NYC Local Law 144. Both require explainable, auditable outputs. The dimension band is the most consequential line in the report, and an I/O psych reviewer or an auditor will ask "how was this band derived." A prose narrative that gestures at the evidence is not equivalent to a structured audit field.

**Fix:** restore the contributing evidence footer on every dimension estimate. It can live inside a collapsed `<details>` block if the concern is visual noise, but the structured link from band to source items must be visible on the page.

**Where:** dimension estimates section of the report. Apply to all 5 dimensions.

---

### 2. Remove "scoring_failed" from user-facing output

Patricia Wu's C-S3 still surfaces as:

```
**C-S3 — scoring_failed**
```

This is raw pipeline status leaking into the report. It should render as "Not scored" or similar editorial language, with operational detail tucked into an audit pane if needed.

**Fix:** in the STAR behavioural responses section, replace the status token `scoring_failed` with a clean label. Proposed: **"Not scored"** in the heading, with a line below reading *"This response could not be scored automatically. Re-analyse the candidate to retry."*

Already partially handled on the summary report format in previous round — this fix is for the new Full Responses section specifically.

---

## Should-fix (polish before external review)

### 3. Amanda Q2 and Q3 both anchor on the same quote

Both Top Questions reference:

> *"choosing to deliver something excellent slightly later"*

Q3 is the stronger probe (goes upstream of the excuse). Q2 should branch to a different evidence anchor so the interviewer covers more ground.

**Fix:** rewrite Amanda Q2 to anchor on one of:
- C-CC2 = 5/5 (maximum endorsement of "I sometimes present my work as more complete or polished than it actually is")
- "I think emotional intelligence is everything in these moments" (from C-S4, the feedback item)
- The C-T2 scenario choice (Option C — fix the flaw quietly afterward)

Any of these gives the interviewer a second, distinct line of attack on the same underlying pattern.

---

### 4. Normalise forced-choice tally labels

Current output mixes display conventions in the Forced-Choice Tallies list:

```
- Interpersonal: **4**
- Conscientiousness: **4**
- motivation_scope: **1**
- motivation_autonomy: **1**
```

The first two are presentation-ready; the last two are raw database labels. Normalise all to the display convention.

**Fix:** apply label transformation to all tally outputs:
- `motivation_scope` → `Motivation: Scope`
- `motivation_autonomy` → `Motivation: Autonomy`
- `motivation_stability` → `Motivation: Stability`
- `motivation_mission` → `Motivation: Mission`
- `motivation_recognition` → `Motivation: Recognition`

Same normalisation on Honesty & Humility (currently inconsistent with internal `honesty_humility` token elsewhere).

---

### 5. Label the Reflection (C-R1) section clearly as self-report

The Reflection section shows only the candidate's answer, no prompt. A reviewer seeing "Colleagues would say I bring energy and positivity to everything I do" needs to know this is self-authored text, not an observed pattern or reference comment.

**Fix:** add the prompt text above the answer, and label the block as self-report:

```
### Reflection (C-R1)

*Self-reported, not scored. How do colleagues describe you, and what would they say you're still working on?*

> [candidate answer]
```

The italic prefix does the framing work.

---

## Design calls worth making explicit

### 6. Interview Focus is empty for clean candidates

Priya Kumar gets no Interview Focus — Top Questions section because no pattern flags fired. This is internally consistent (probes are generated against flags) but leaves the interviewer without guidance when Composure and Interpersonal both sit at Limited Signal.

**Option A (preferred):** for any candidate with zero pattern flags, generate one "gap probe" targeted at the lowest-evidence dimension. The probe should be framed as verification, not challenge. Example for Priya: *"Composure sits at limited signal in this assessment because we didn't see a specific high-pressure moment in your responses. Can you walk me through a recent situation where something went badly wrong under pressure, and how you handled the first few hours?"*

**Option B:** document explicitly that clean candidates skip Interview Focus. Add a short note under the Strengths section: *"This candidate generated no pattern flags. Standard competency and technical probes recommended in addition to reference-checking."*

Either is defensible. Pick one and make it consistent.

---

### 7. "Open Questions" section fires inconsistently

The "Open Questions" section appears on: Patricia, Amanda, Robert, James.
Absent on: Marcus, Tom, Lucy, Priya.

The trigger logic isn't obvious from reviewing the reports. It looks like it's probing dimensions with Insufficient Signal that didn't make Top Questions.

**Fix (one of):**

- **Consolidate.** Fold Open Questions into Interview Focus — Top Questions with a clear sub-label like "From signal gaps:" to distinguish from "From pattern flags:". One section, cleaner hierarchy.
- **Document.** Add a trigger comment in the generator and update the spec so the section's presence or absence is predictable. Recruiters should be able to tell whether "no Open Questions" means "none fired" vs "this candidate doesn't need any."

Preference is to consolidate — fewer sections on the page, easier for recruiters to scan.

---

## Optional / defer

### 8. Lucy Q1 and Amanda Q1 use near-identical templates

Both probe the C-CC1 divergence with similar structural phrasing ("elsewhere your responses paint a picture of..."). Templating is fine at current scale (same flag → similar probe) but once more candidates flow through this will read as copy-paste.

**Defer for now.** Worth addressing when the prompt library expands. A simple fix is to maintain 3-4 surface phrasings for each flag type and rotate.

---

### 9. Final reflection (C-R1) visibility

Candidate's final reflection text is now shown in full. This is valuable — Amanda's is a clinic in impression management and surfaces signal the rubrics don't always catch. Keep as-is with the self-report label from item 5.

---

## Out of scope — verify these deprecations were intentional

The following sections from the previous report format are gone. Flagging to confirm these were deliberate cuts, not regressions:

- **Interpersonal Style Profile table** (Directness / Conflict Approach / Regard / Follow-through) — probably good to cut, sat awkwardly outside the dimension narrative
- **Forced-Choice Profile prose summary** ("Strongest preference toward...") — probably fine, redundant with tallies
- **Motivational Priorities prose section** — fine, ranking is clear from the numbered list

If any of these were cut unintentionally, worth reinstating. If intentional, no action.

---

## Recommended order of implementation

1. Items 1 and 2 first — these are the ones an I/O psych reviewer will notice immediately.
2. Items 3, 4, 5 next — pure polish, quick fixes.
3. Items 6 and 7 — make the design call, apply consistently.
4. Item 8 — queue for later.

Re-run all 8 seeded candidates after each batch to verify no regressions.
