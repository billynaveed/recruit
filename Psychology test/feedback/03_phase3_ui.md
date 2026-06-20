# Phase 3 — Reviewer UI Rework

**Goal:** Restructure the web reviewer view so that the synthesis from Phase 1 and follow-ups from Phase 2 are the primary content. Raw rubric features move to progressive disclosure. Nothing looks like a personality quiz.

---

## 3.1 Overall layout

Desktop: single-column, max-width ~840px, centred. Mobile: full-width with comfortable padding.

The view is a single scrollable page with five progressively disclosing tiers. Users scroll; there are no tabs. Each tier is collapsible except the first.

```
┌───────────────────────────────────────────────────────────┐
│ TIER 1: 60-SECOND PANEL (always expanded)                 │
├───────────────────────────────────────────────────────────┤
│ TIER 2: DIMENSION CARDS (collapsed by default)            │
├───────────────────────────────────────────────────────────┤
│ TIER 3: PATTERNS & RESPONSE STYLE (collapsed)             │
├───────────────────────────────────────────────────────────┤
│ TIER 4: FULL RESPONSES (collapsed)                        │
├───────────────────────────────────────────────────────────┤
│ TIER 5: SCORING DETAIL / AUDIT (collapsed)                │
├───────────────────────────────────────────────────────────┤
│ STANDING FOOTER (always visible)                          │
└───────────────────────────────────────────────────────────┘
```

Each tier has a clear header and a disclosure chevron. Expanded state persists across page reloads via URL state or local storage.

---

## 3.2 Visual and typographic direction

The reviewer view should look and feel like a **serious editorial document**, not a dashboard. Reference: the Financial Times long-read, The Economist analysis pages, or a well-designed analyst report. It should read as considered, not slick.

### Hard rules — things NOT to do

- No radar charts (implies precision)
- No progress bars on dimensions (implies score)
- No percentages, no decimals, no 0–100 scores
- No emoji for status indicators
- No colourful personality-type badges ("Driver", "Collaborator", "Analyst")
- No pie charts, no donut charts
- No avatar-style character illustrations
- No generic AI-product purple gradients
- No cartoon icons

### Recommended direction

- Typography: a serif for editorial content (Fraunces, Source Serif, or similar) paired with a neutral sans for UI chrome (Inter is acceptable here despite being overused because it stays out of the way)
- Colour: neutral base with a single accent colour. Muted palette — ink blue or deep green rather than bright blue. Semantic colours (red/amber) only for flags and error states, muted not saturated.
- Spacing: generous. White space communicates rigour.
- Band display: text labels with small ordinal indicators (e.g., a horizontal ink-filled block scale ░▓▓▓▓ for the band level). No percentages, no bars.
- Confidence indicator: a small inline label like *"confidence: rich"* in muted grey, not a badge
- Flags: bordered cards with clear severity accent on the left edge. No background fills, no exclamation marks.

### Tone of writing

Plain, specific, and slightly sparse. Avoid:

- "Candidate demonstrates..." (generic consultant voice)
- "Strong potential for..." (horoscope voice)
- "Shows alignment with..." (HR-speak)

Prefer:

- "In the recent-work item, [candidate name] described rebuilding a content piece overnight after a featured founder pulled out..."
- "Three behavioural responses lacked specific detail; one described a mistake as 'wasn't a big deal in the end.'"

---

## 3.3 Tier 1 — 60-second panel

This is the most important screen in the product. Everything upstream of this matters; if this panel is weak, the product doesn't land.

### Layout

```
{Candidate name}                                    {Role title}
Submitted {date} · Duration {minutes}

─────────────────────────────────────────────────────

ROLE-FIT READ                              OVERALL CONFIDENCE
{band label, prominent}                    {rich/moderate/limited}

{1-2 sentence rationale, serif, slightly larger than body}

{italic caveat about not being a hire/no-hire recommendation}

─────────────────────────────────────────────────────

PATTERNS & CONCERNS
[zero or more flag cards, sorted by severity]

STRENGTHS
•  {strength 1 — serif, 1 sentence}
•  {strength 2}
•  {strength 3}

OPEN QUESTIONS
•  {open question 1 — serif}
•  {open question 2}

INTERVIEW FOCUS
1. {follow-up question 1}
2. {follow-up question 2}
3. {follow-up question 3}
   [copy all questions to clipboard] [regenerate]

─────────────────────────────────────────────────────
```

### Flag cards

Each flag is a horizontally-bordered card:

```
│ HIGH-SEVERITY ACCENT
│
│ {flag label — medium weight, no uppercase shouting}
│ {description — 2-3 sentences, plain prose}
│
│ Referenced items: {section labels, linked to tier 4}
│
│ Suggested probe:
│ "{follow-up question generated for this flag}"
└
```

- High-severity flags: left border ~4px, in a muted red (not bright)
- Medium-severity flags: left border ~4px, in a muted amber
- Operational flags: left border ~4px, in neutral grey, with a "Retry scoring" action

### Interview focus

The three top-ranked follow-up questions from Phase 2. Numbered 1, 2, 3. A "Copy all" button copies all three as plain text for pasting into interview notes. Each question has a small "regenerate" icon for if the reviewer wants a different angle.

---

## 3.4 Tier 2 — Dimension cards

Six core dimension cards (seven if the candidate took a role-family bundle with engineer-mindset items). Each card is collapsed by default; clicking expands.

### Collapsed state

```
▸ {Dimension name}          {band label} · confidence {rich/mod/limited}
```

### Expanded state

```
▾ {Dimension name}          {band label} · confidence {rich/mod/limited}

{2-3 sentence prose summary from Phase 1.2}

Contributing evidence:
  ▸ {Item section label}        band: {item band}
  ▸ {Item section label}        band: {item band}
  ▸ Forced-choice signal: {prose rank-order summary for the contributing pairs}
  ▸ Consistency check: {response + interpretation, if contributing}

Suggested follow-up for this dimension:
  "{generated question}"                               [regenerate]
```

Each contributing-evidence item is itself clickable, jumping the view to the corresponding response in Tier 4.

### Profile dimensions (Interpersonal, Motivation)

Render differently — no single band. Display as structured profile with each component labelled:

```
▾ Interpersonal style                                      profile

[from Part 8 — Hard feedback and forced-choice signals]

Directness: {direct | hedged | unclear}
Conflict approach: {engages | avoids | mixed}
Regard for others in descriptions: {respectful | dismissive | defensive}
Follow-through after feedback: {tracked | absent}

{2-3 sentence prose interpretation — not a band, but what the profile means}

Contributing evidence: ...
Suggested follow-up: ...
```

Motivation profile similar — show top motivators, bottom motivator, role-alignment note (only if relevant), contributing FC tallies as prose.

---

## 3.5 Tier 3 — Patterns and response style (collapsed)

This tier surfaces observations that are descriptive, not evaluative.

### Structure

```
▾ PATTERNS AND RESPONSE STYLE

Response specificity: {high | medium | low}
Based on: {N of 4 STAR items at {level}}.

First-person agency: {high | medium | low | mixed}
Based on: how consistently the candidate used "I" language describing actions.

Attribution patterns: {internal | mixed | external}
In behavioural responses, did the candidate attribute events to their own decisions or to external factors?

Response length: {average words per open-ended item, vs. expected range}

All consistency check responses in raw form:
  C-CC1: "I sometimes leave tasks unfinished..." → {response}
  C-CC2: "I sometimes present my work as more complete..." → {response}

Contradictions surfaced (non-flag):
{any lower-severity divergences between responses that weren't severe enough for a top-panel flag}
```

These are observations, not scored. They're for reviewers who want more texture before an interview.

---

## 3.6 Tier 4 — Full responses (collapsed)

The raw candidate content, organized by section. Non-negotiable that this is accessible — any claim upstream must be auditable here.

### Structure

```
▾ FULL RESPONSES

[Role-specific questions — expandable subsection per question]
  ▸ {Question 1}
  ▸ {Question 2}
  ...

[Standard questions — expandable subsection per question]
  ▸ {Question 1}
  ...

[Behavioural assessment items — expandable per item]
  ▸ Part 1 — A recent piece of work
      Prompt: ...
      Response: (full verbatim)
      
      [Show rubric features — further expandable]
  ▸ Part 2 — Which is more like you (forced-choice)
      (show each pair and pick)
  ...
```

Linking: from any dimension card's "contributing evidence" row, clicking scrolls/expands to the relevant item here.

---

## 3.7 Tier 5 — Scoring detail (collapsed, audit-facing)

For reviewers who want to see the raw scoring pipeline output. Clearly labelled as "Scoring detail — for auditing and troubleshooting."

Shows:

- Per-item rubric feature extractions (the JSON, formatted readably)
- Model used for each scored item (GLM / Gemma / Sonnet)
- Rubric version used
- Forced-choice raw pair-by-pair picks
- Timestamp of scoring
- Any scoring failures with retry buttons

This is not a primary reviewer surface. It exists for transparency and debugging.

---

## 3.8 Standing footer (always visible)

At the bottom of the viewport (not the page — always sticky at bottom, subtle):

> *This report is a structured summary of a short assessment. It is not a psychological evaluation. Use alongside, not in place of, interviews and work samples.*

Small type, muted colour, non-intrusive but always present.

---

## 3.9 Interactions and accessibility

- **Keyboard navigation:** all collapsible sections operable by keyboard; Tab + Enter
- **Copy-to-clipboard:** follow-up questions, dimension summaries, full response text all have copy buttons
- **Print view:** a dedicated print stylesheet that expands everything and removes interactive chrome, for reviewers who want a PDF export
- **Permalink to candidate:** stable URL per candidate report
- **Screen reader:** every band, confidence level, and flag has a screen-reader-appropriate label
- **Responsive:** works comfortably on tablet and mobile

---

## 3.10 Things to remove from the current view

Explicitly remove from the current reviewer view:

- The "X / 13" forced-choice tallies displayed as ratios
- Per-item rubric feature bullet lists displayed inline (move to Tier 5)
- Any progress-bar-like visualisations of dimension scores
- The literal label "Psychometric profile" — replace with something plainer like "Behavioural assessment summary" or just let the dimension cards speak for themselves
- Any "score" framing anywhere in the UI

---

## 3.11 Testing — do not mark Phase 3 complete until

For all 8 seeded candidates:

1. Open the reviewer view and time how long it takes to form an accurate impression without scrolling past the 60-second panel. Target: under 60 seconds.
2. For each candidate, the 60-second panel should be sufficient for a hiring manager to decide whether to interview. Drilling into lower tiers should add depth, not introduce surprises.
3. Amanda Fox's integrity pattern should be the **first thing** visible in her 60-second panel — not buried, not softened.
4. James Wong's role-fit mismatch should be obvious from the role-fit read and flag, but his behavioural profile should show clean — no false flags on honesty or reliability.
5. Priya Kumar's strengths should reference her actual work (the freelance tracking system, the content series, the pricing error she flagged to a client) — not generic strengths.
6. The page should look like something you'd be comfortable showing a psychology professor. If it looks like an AI-product dashboard, redesign.
