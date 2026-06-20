# Phase 1 Feedback — Fixes Before Phase 2

**Status:** Phase 1 is mostly working. Two reports were reviewed (Marcus Webb - Strong; Amanda Fox - Unsuitable). The synthesis layer is doing real work — Marcus reads as Strong fit with converging strengths, Amanda reads as Likely mis-fit with the integrity pattern flagged prominently. This is the biggest thing Phase 1 was meant to deliver, and it's working.

Before starting Phase 2, fix the specific issues below. They're ordered by severity.

---

## Fix 1 (HIGH PRIORITY) — Text rendering bug: dimension labels smashed together in PDF export

### Problem

In the PDF export of candidate reports, dimension names and band labels are rendering smashed together. Examples from Marcus Webb's report:

- `LeaSrtnroinnggpOosriiteivnetsaitginoanl` — should read "Learning Orientation" [space] "Strong positive signal"
- `ComMpodoesrautreepositive signal` — should read "Composure" [space] "Moderate positive signal"
- `HonestySt&ronHgupmosiliittivye signal` — should read "Honesty & Humility" [space] "Strong positive signal"
- `ConscieSntrtoiongupsonseitsivse signal` — should read "Conscientiousness" [space] "Strong positive signal"

Same pattern on Amanda Fox's report.

### Root cause

Almost certainly a CSS layout issue where the dimension name (left-aligned) and band label (right-aligned) are positioned with flexbox, grid, or absolute positioning, and the whitespace that separates them on the web does not survive PDF conversion. The characters are interleaving in the PDF output.

### Fix

1. Inspect how the dimension card header is built in the reviewer UI
2. Ensure dimension name and band label are separated by either:
   - A proper table structure with distinct cells, OR
   - Explicit whitespace characters that render in both HTML and PDF, OR
   - Separate block-level elements with visible margin between them (not just flex gap which may not export correctly)
3. Test the PDF export specifically — do not rely on the web view rendering correctly
4. Apply the same fix to every place where a dimension name appears next to a band label

### Verification

Generate PDF exports for Marcus Webb and Amanda Fox. All dimension-name-plus-band-label pairs must render with clear whitespace between them. No interleaved characters.

---

## Fix 2 (HIGH PRIORITY) — Overall confidence calculation is broken in both directions

### Problem

- **Marcus Webb:** shows "Moderate signal — partial convergence" but should be **rich signal**. Every STAR item scored strong_positive, forced-choice tallies converge with behavioural evidence, T2=Option A, CC1=1, CC2=1, no pattern flags. This is textbook rich convergence.
- **Amanda Fox:** shows "Moderate signal — partial convergence" but should also be **rich signal**. C-CC2=5, T2=C, reframed mistake in C-S2, mission last in T1, external attribution in C-S1 — these all converge, just in a concerning direction. The confidence is high; the news is bad.

The algorithm appears to conflate "signal direction is negative/concerning" with "signal is ambiguous." These are different things.

### Correct behaviour

**Overall confidence is a measure of evidence quantity and consistency, not of evidence sentiment.**

- Rich signal: 3+ dimensions have rich_signal AND signals across those dimensions converge (all positive, all negative, or a clear coherent pattern)
- Moderate signal: dimensions have mixed confidence, or 2-3 dimensions with signal but one or more dimensions missing
- Limited signal: fewer than half the expected dimensions contributed, or signals conflict substantially across dimensions

### Fix

1. Compute overall confidence only across dimensions that produced a band (not profile dimensions, not insufficient_signal dimensions)
2. Do NOT penalise overall confidence for dimensions that correctly returned insufficient_signal — that's a correct output, not a missing one
3. Do NOT penalise overall confidence because the pattern is concerning — a converging concerning pattern is still rich signal
4. Conflict (genuine conflict between items, not just negative signal) does downgrade confidence — this is correct, but the algorithm needs to distinguish conflict from negativity

### Verification

- Marcus Webb must show "Rich signal — strong convergence" or equivalent wording
- Amanda Fox must show "Rich signal — converging concerning pattern" or equivalent wording (the wording should name what kind of convergence, whether good or concerning)

Test against all 8 seeded candidates. Expected confidences:
- Marcus Webb: rich
- Priya Kumar: rich
- Amanda Fox: rich (concerning convergence)
- Robert Kane: rich (concerning convergence)
- Patricia Wu: moderate
- Tom Bradley: moderate
- Lucy Chen: moderate to rich (role-mismatch with converging evidence)
- James Wong: moderate to rich (role-mismatch with converging evidence)

---

## Fix 3 (HIGH PRIORITY) — Amanda Fox's dimension bands are systematically too generous

### Problem

Amanda's dimension bands do not match the converging evidence. Specifically:

- **Honesty-Humility: Mixed** — should be **concern** or at minimum **limited_signal negative**. Evidence against: C-T2=C (-1), C-CC2=5 (flagged as concern when combined with other negative signals per §1.1 rules), H-H forced-choice tally near zero, C-S2 reframes mistake as "choosing to deliver something excellent slightly later" with rubric mistake_genuineness=minor_or_reshaped. No positive H-H evidence. "Mixed" implies conflicting signals — there are no conflicting signals here, all point the same concerning direction.
- **Conscientiousness: Moderate positive** — too generous. Her C-S1 has attribution_pattern=external, problem_ownership=shared, specificity=low. C-CC1=5 (agrees she leaves tasks unfinished). FC tally is 4 but without corroborating behavioural evidence, this should be **mixed** at best.
- **Learning Orientation: Mixed** — should be **limited_signal** or **concern**. Her C-S3 rubric: nature_of_shift=performative, specificity_of_original_view=low, specificity_of_counterargument=low. No evidence of genuine belief update.

### Root cause hypothesis

The aggregation may be averaging across signals without applying the §1.1 rule that says "if signals conflict → mixed; if all negative → concern band."

It's also possible the aggregation weights forced-choice tallies too heavily relative to STAR rubric evidence when the two conflict. STAR items with rich rubric feature extraction should carry more weight than pure forced-choice tallies, especially when the rubric explicitly catches concerning patterns.

### Fix

1. Re-check the §1.1 aggregation rules in `01_phase1_synthesis.md`
2. Verify the rule: "all contributing signals point negative → band = concern" is implemented and firing
3. Add weighting: STAR items with scored rubric features outweigh pure forced-choice tallies when they disagree. A candidate who scored `strong_positive` on the STAR should anchor the band higher than FC tallies alone; a candidate whose STAR rubric flagged external attribution, low specificity, and reframed mistake should anchor the band lower than FC tallies alone.
4. Add a new band option: `concern` — for dimensions where evidence converges negatively. This is distinct from `mixed` (conflicting evidence) and `limited_signal` (not enough evidence). Amanda's H-H is `concern`, not `mixed`.

### Verification

Amanda Fox after fix should show:
- Honesty-Humility: **concern** (rich signal — converging negative)
- Conscientiousness: **mixed** (FC positive but behavioural evidence contradicts, C-CC1=5)
- Learning: **limited_signal** or **concern**
- Composure: limited_signal (current "Limited signal" is probably correct)
- Interpersonal: current profile output looks reasonable

Marcus Webb should remain unchanged (strong positive across H-H, Conscientiousness; moderate positive on Composure; strong positive on Learning).

---

## Fix 4 (MEDIUM PRIORITY) — Amanda Fox is missing the external attribution flag

### Problem

The pattern detector `EXTERNAL_ATTRIBUTION_PATTERN` should trigger when 2+ STAR items show attribution_pattern=external OR ownership=externalized. Looking at Amanda's rubric features:

- C-S1 rubric: attribution_pattern=external ("things outside my control — a supplier issue and some internal capacity constraints")
- C-S2 rubric: mistake_genuineness=minor_or_reshaped, but ownership reads as partial/externalized via reframing

The flag may not be firing because the C-S2 rubric ownership field wasn't externalized explicitly (it was reframed, which is a different rubric dimension). But the spirit of the detector — "consistent external attribution across behavioural items" — does apply to Amanda.

### Fix

Review the detector's trigger conditions. Consider expanding to also trigger when:
- `attribution_pattern == external` in 2+ items, OR
- `ownership == externalized` in 2+ items, OR
- `attribution_pattern == external` in 1 item AND `mistake_genuineness == minor_or_reshaped` in another item AND `ownership != owned` in that same item

The third condition catches Amanda's specific pattern of externalising in one item and reframing-away the mistake in another, which together constitute the same underlying concern.

### Verification

Amanda Fox should show 4 flags total (not 3): the three currently showing plus EXTERNAL_ATTRIBUTION_PATTERN. The flag's description should cite both C-S1 ("things outside my control") and C-S2 (the reframed deadline miss).

---

## Fix 5 (MEDIUM PRIORITY) — Marcus's "Overall Confidence" explanation is generic

### Problem

Marcus's overall confidence rationale reads as generic analyst copy:

> "This person's strong signals on honesty-humility and conscientiousness suggest a CEO who will hold themselves and others to high standards without letting ego drive decisions, while their moderate composure signal indicates they generally stay steady under pressure, though high-stakes stress may occasionally test that steadiness."

This is not a confidence explanation — it's a personality summary that sounds like generic executive-profile copy. It doesn't reference his actual evidence.

Amanda's rationale is better (it cites specific signals), but still doesn't quite work as a confidence explanation — it reads more like a concerns summary.

### Correct behaviour

The "Overall confidence" explanation should answer: *"How much signal do we have, and how consistent is it?"* — not *"What kind of person is this candidate?"*

Two separate surfaces:

1. **Overall confidence rationale** (short, factual): "Rich signal. All four behavioural items scored successfully with converging strengths; forced-choice tallies align with STAR evidence; no scoring failures or conflicting items."
2. **Role-fit rationale** (existing surface, already at top): can carry the interpretive one-liner about what the signals mean for the role.

Currently it looks like the two are merged.

### Fix

Separate the two. The overall-confidence line should be factual and brief ("Rich signal — N items scored, M dimensions with converging evidence"). The role-fit rationale below it carries the interpretation.

### Verification

Marcus Webb:
- Overall confidence: "Rich signal — four behavioural items scored with converging evidence; dimension signals align with forced-choice tallies."
- Role-fit rationale (separate): the interpretive sentence about what this means for a CEO.

Amanda Fox:
- Overall confidence: "Rich signal — four behavioural items scored, with multiple items converging on a concerning pattern around transparency and ownership."
- Role-fit rationale (separate): the interpretation.

---

## Fix 6 (LOWER PRIORITY) — Interview focus section is missing from both reports

### Problem

Neither Marcus's nor Amanda's 60-second panel shows the "Interview focus" section with 2-3 auto-generated follow-up questions. This is a Phase 2 feature so it's expected to be missing from the flag-attached questions, but the top-of-panel interview focus section should still exist as a container even if empty.

Looking at Amanda's report there's an "Open questions" section with one question, which is useful. But the dedicated "Interview focus" area for candidate-specific probes is absent.

### Fix

This is Phase 2 work, but before starting Phase 2:
1. Ensure the layout reserves space for the "Interview focus" section in the 60-second panel even when empty
2. Ensure flag cards have a designated "Suggested probe" sub-area that will be populated in Phase 2
3. The existing "Open questions" section (currently showing one on Amanda) can continue to work as-is — it's different from follow-up questions; open questions are about dimensions where signal was insufficient, follow-ups are specific probes for patterns or strengths

---

## Fix 7 (LOW PRIORITY) — Strengths sentences are strong but Amanda gets an odd one

### Problem

Amanda's only strength sentence is:

> "In Part 1, the candidate held regular check-ins and sustained team momentum through supplier and capacity setbacks, ultimately delivering a result the team was proud of, with forced-choice pairs reinforcing this pattern across four of six relevant comparisons."

This is too generous. Her C-S1 rubric has attribution_pattern=external, specificity=low, problem_ownership=shared — these are not strengths. The strength-generator appears to be taking her self-presentation at face value ("held regular check-ins", "team was proud") rather than grounding in the rubric features.

### Fix

The strength generator should only produce a strength bullet when the underlying rubric features support it. Rules:

1. Only generate a strength from an item where the item-level band is `strong_positive` or `moderate_positive`
2. Do not generate a strength if key rubric features (specificity, problem_ownership, attribution_pattern, mistake_genuineness) show concerning values even if the item scored mixed
3. For candidates like Amanda, it's acceptable to show zero strengths in the 60-second panel. Absence of strengths is itself informative.

### Verification

Amanda should show zero strengths (not a forced one). Marcus should continue to show 3-4 real strengths grounded in his rubric features.

---

## Summary — before Phase 2, these must be fixed

- [ ] Fix 1 (HIGH): PDF text rendering of dimension labels
- [ ] Fix 2 (HIGH): Overall confidence calculation for both Marcus and Amanda
- [ ] Fix 3 (HIGH): Amanda's dimension bands — add `concern` band, fix aggregation weighting
- [ ] Fix 4 (MEDIUM): External attribution flag firing on Amanda
- [ ] Fix 5 (MEDIUM): Separate overall-confidence rationale from role-fit rationale
- [ ] Fix 6 (LOW): Layout container for Phase 2 interview focus section
- [ ] Fix 7 (LOW): Strength generator should not manufacture strengths that aren't supported by rubric features

After these fixes, re-test against all 8 seeded candidates before proceeding to Phase 2. Send the updated reports for Marcus and Amanda for another review.
