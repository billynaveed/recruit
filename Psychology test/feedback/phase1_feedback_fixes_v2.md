# Phase 1 Feedback — Round 2 (post-fix validation across all 8 candidates)

**Status:** 6 of 7 original fixes landed cleanly. Two issues remain from round 1, two new issues surfaced from the broader 8-candidate run. Fix these before Phase 2.

**Candidates reviewed:** Marcus Webb (CEO/Strong), Patricia Wu (CEO/Mediocre), Robert Kane (CEO/Unsuitable), Amanda Fox (CEO/Unsuitable), Priya Kumar (ME/Strong), Tom Bradley (ME/Mediocre), Lucy Chen (ME/Unsuitable-wrong-profile), James Wong (ME/Unsuitable-wrong-direction).

---

## What landed cleanly — do not touch

- **Fix #2 — Overall confidence calculation.** Marcus and Priya show "Rich signal — strong positive convergence." Amanda and Robert show "Rich signal — converging concerning pattern." Richness vs. direction now correctly separated.
- **Fix #3 — Amanda's dimension bands and the new `concern` band.** Amanda: H&H Concern, Conscientiousness Mixed, Learning Limited. Robert: same H&H Concern. The `concern` band is doing real work.
- **Fix #4 — External attribution flag on Amanda.** Firing correctly, referencing Part 1 and Part 3.
- **Fix #5 — Overall confidence rationale vs role-fit rationale.** Two distinct blurbs across all four reviewed reports. Clean separation.
- **Fix #6 — Interview focus layout container.** Placeholder present on all reports, ready for Phase 2 to populate.
- **Fix #7 — Strengths generator no longer manufacturing.** Amanda shows zero strengths. Robert shows one heavily caveated strength, which is the correct call — not whitewashed, not zero.

---

## Remaining issues to fix

### Issue 1 — PDF text rendering (partial regression from round 1 fix #1)

**Status:** the original "smashed together" bug (e.g. `LeaSrtnroinnggpOosriiteivnetsaitginoanl`) is gone. But a new truncation/duplication pattern has appeared in the Dimension Estimates block across every single report.

**Evidence (from Marcus Webb's report):**
- `Learning Orientation Strong positive sign` (truncated mid-word)
- `Composure Moderate positive signal mod` ("mod" fragment appears after the full label)
- `Interpersonal Style Insufficient signal li`
- `Honesty & Humility Strong positive signal` (correct)
- `Conscientiousness Strong positive signal` (correct)

**Pattern:** appears to be a CSS overflow / text-ellipsis bug where the band label is being rendered twice — once as the visible label and once as a tooltip or second element that's bleeding into the PDF export. The API returns the right data; the PDF rendering layer is breaking it.

**Fix scope:** PDF renderer only. Scoring and aggregation pipeline is fine. Check the component that renders dimension rows in the PDF export — likely a `title` attribute, `aria-label`, or duplicated span being rendered as text in the print stylesheet.

**Priority:** high. An I/O psychologist reviewing this will notice it on the first page and it undermines every claim the product makes about editorial rigour.

---

### Issue 2 — Specificity-deficit flag not firing on Patricia Wu

**Expected:** Patricia should trigger the "Behavioural responses consistently lack specificity" flag. Her C-S1 and C-S2 are textbook generic STAR responses with no named people, no specific outcomes, no concrete numbers or timeframes.

**Evidence:**
- C-S1: "some challenges with delivery... different stakeholders had different expectations... it took a while but eventually we got to a place where everyone was on the same page"
- C-S2: "we underestimated the time required... fell behind schedule and had to request an extension"

Compare to Tom Bradley (Marketing Engineer, same vagueness profile) — his specificity flag fires correctly against Part 1 and Part 5.

**Observed:** only the mission-last flag fires on Patricia. The specificity flag is absent.

**Likely cause:** Patricia has a `Scoring failed 313 chars` on C-S3 (see Issue 4 below). The specificity-flag aggregator is probably requiring all four STAR items to have scored before it evaluates the pattern. One scoring failure suppresses the entire flag.

**Fix:** the specificity-deficit flag should trigger on any 2+ scored items showing the pattern, regardless of whether other items scored or failed. Flag logic should be tolerant of partial scoring outcomes. Don't let one upstream failure silently suppress diagnostic signal.

**Priority:** high. This is a core diagnostic pattern. If it can be silently suppressed by a scoring failure on an unrelated item, the instrument isn't robust enough to trust.

---

### Issue 3 — Role-fit mismatch pattern fires on James but not on Lucy

**What's working:** James Wong correctly fires "Technical strength without marketing or creative instinct" — referencing role-specific questions. This is the exact diagnostic the instrument was designed to surface. Good.

**What's missing:** Lucy Chen should fire the mirror-image pattern — something like "Traditional marketing frame, rejects AI-first approach" or "Role-direction mismatch: marketing without automation or AI fluency".

**Evidence from Lucy's report that should trigger it:**
- Q2 (AI tool/automation/script built): lists Canva and Hootsuite only. Zero built tooling. Explicitly says "the best tools are the ones that are intuitive and don't require too much technical knowledge to use effectively."
- Q3 (how AI is changing marketing): "authentic human connection will always be what makes marketing truly work... I prefer to focus on understanding the audience and crafting genuine messages rather than relying on technology."
- Q4 (£500 campaign): proposes a local in-person event, no digital or AI component at all.

**Observed:** Lucy's narrative mentions "a preference for predictable environments" (pulled from stability-first) but no pattern flag surfaces the AI-rejection signal specifically.

**Fix:** add a Marketing Engineer role-direction detector that triggers on the combination of:
- Q2 containing no built automations or scripts (only off-the-shelf SaaS tools listed), AND
- Q3 containing explicit preference for non-technical / human-only approaches, AND
- Q4 proposing campaigns with no AI/automation/digital infrastructure component

This is the mirror of the existing James detector. Both flags together demonstrate that the instrument correctly distinguishes **wrong behavioural profile** (Robert, Amanda) from **wrong role direction** (Lucy, James) — which is a design goal for the product.

**Priority:** high. Without this, the instrument can only catch one of the two role-direction failure modes, and Lucy's archetype (the traditional marketer) is arguably the more common false-positive in real hiring.

---

### Issue 4 — Scoring failures surfacing to user-facing report

**Evidence:** Patricia Wu's C-S3 shows `Scoring failed 313 chars` in the Behavioural Responses section of the PDF.

**Problem:** this is raw pipeline failure leaking into editorial output. Reviewers should not see "Scoring failed" labels. It's the equivalent of a spreadsheet showing `#REF!` to an end user.

**Fix:** handle scoring failures upstream of the report. Three acceptable approaches, ranked:

1. **Preferred:** silently exclude the failed item from the Behavioural Responses display, AND add the item to the Overall Confidence calculation as "1 item did not score" so reviewers understand the signal is based on 3 items rather than 4.
2. Show the item with a neutral label like "Response not scored" — only if it's editorially cleaner than excluding it.
3. (Phase 5 territory) add an operational retry before falling through to a failure state.

Whatever is done, "Scoring failed" as visible text in a user-facing report needs to go.

**Priority:** high. This is a credibility issue for any external reviewer.

---

## Secondary observations — not blocking Phase 2, worth queuing

- **Robert's strength blurb contains an awkward quoted fragment.** "suggesting a willingness to engage with challenge that stops short of substantive belief revision" is psychologically accurate but reads clunky. The strength generator is doing the right thing by heavily caveating; the prose just needs a pass. Low priority.
- **Motivational priorities secondary probe text for "Stability high, mission low" only renders on mid-ambiguity warning.** Amanda and Robert both have mission-last and get the probe correctly. Lucy and Tom have stability-top and also get the probe. No bug — flagging here just to confirm the logic is consistent across both roles.
- **Marcus's report is very clean editorially.** Four strengths, each evidence-grounded, specific, traceable to a STAR response and/or forced-choice pattern. This is the bar the rest should be measured against.

---

## Go/no-go for Phase 2

**Recommendation: do not start Phase 2 yet.** Fix issues 1-4 above first, then re-run Patricia Wu and Lucy Chen specifically to validate. Once:

- Patricia's specificity flag fires,
- Lucy's role-direction-mismatch flag fires,
- "Scoring failed" no longer appears on any report,
- Dimension estimate rendering in the PDF is clean,

greenlight Phase 2.

Reason for holding: Phase 2 (auto-generated follow-up questions) is going to be driven by the pattern flags. If a flag is silently suppressed (Patricia) or missing a detector (Lucy), Phase 2 will inherit those gaps and compound them. Cleaning up Phase 1 flag logic before Phase 2 is built on top of it is the right order.

---

## Files that may need edits

(Inferred — confirm against actual repo structure.)

- PDF renderer component for dimension estimates → fixes Issue 1
- Flag aggregator / pattern detection module → fixes Issue 2 and Issue 3
- STAR response display component + overall confidence calculator → fixes Issue 4
- Role-family pattern library for Marketing Engineer → fixes Issue 3 (add new detector)
