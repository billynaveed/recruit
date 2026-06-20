# Reviewer View Rework — Implementation Spec

**Read this first.** This is a multi-phase rework of the candidate assessment reviewer view. The scoring pipeline is working correctly; the problem is the synthesis and display layer.

## What exists today (do not rebuild)

- Per-item rubric feature extractions (LLM-generated, accurate)
- Per-item band estimates: `strong_positive | moderate_positive | mixed | limited_signal | scoring_failed`
- Forced-choice tallies per dimension
- T1 motivational ranking, T2 integrity-scenario choice
- Consistency check values (1–5 Likert)
- STAR response text
- Role-specific question responses
- LLM scoring pipeline with fallback cascade: GLM → Gemma → Anthropic Sonnet

## What's missing and causing the report to underperform

1. No dimension-level aggregation — only per-item bands are shown
2. No prose synthesis — raw rubric features are displayed where insight should be
3. No contradiction or pattern detection — e.g. CC2=5 + T2=C + externalized ownership is just data, not a flag
4. No role-fit read at the top of the report
5. No auto-generated follow-up interview questions
6. No "60-second panel" executive summary
7. Forced-choice displayed as ratios ("4 / 13") rather than rank-order prose
8. No cross-candidate comparison view
9. Scoring failures fail silently with no retry mechanism
10. Report tone is generic corporate-bland rather than rigorous

## Reference documents (in repo root)

- `psychology_assessment_module_spec.md` — architecture and output requirements
- `core_items_v1_draft.md` — core item rubrics and scoring rules
- `role_family_bundles_v1.md` — role-family bundles and engineer-mindset dimension

## Implementation order — STRICT

Work through the phases in numerical order. Do not begin a phase until the previous one is complete and tested on the 8 test candidates.

- **Phase 1** (`01_phase1_synthesis.md`) — Dimension aggregation, prose summaries, pattern detection, role-fit read. This is the single biggest fix.
- **Phase 2** (`02_phase2_followups.md`) — Auto-generated follow-up interview questions grounded in candidate responses.
- **Phase 3** (`03_phase3_ui.md`) — Reviewer UI rework: 60-second panel, dimension cards, progressive disclosure.
- **Phase 4** (`04_phase4_crosscandidate.md`) — Cross-candidate comparison view.
- **Phase 5** (`05_phase5_operational.md`) — Scoring-failure handling, retry, audit logging, and operational hygiene.

## Design principles (apply throughout)

- **Every claim traces to evidence.** Any dimension band, flag, or summary sentence must be linked back to the specific items and excerpts that produced it. No freestanding claims.
- **No decimals, no 0–100 scores, no bar charts.** Use ordered bands. Use prose. Use rank orders.
- **Band labels use plain words**, not jargon: "strong positive signal" not "strong_positive". Map the enum to display strings in the view layer.
- **Clinical terms are prohibited.** No "narcissistic," "anxious," "neurotic," "defensive," etc. Describe behaviour, not personality.
- **The instrument is a decision aid, not a decision.** Every report carries the standing footer: *"This report is a structured summary of a short assessment. It is not a psychological evaluation. Use alongside, not in place of, interviews and work samples."*

## Testing requirement for every phase

Test against all 8 seeded candidates (Marcus Webb, Patricia Wu, Robert Kane, Amanda Fox, Priya Kumar, Tom Bradley, Lucy Chen, James Wong). The ground-truth ratings are in `CANDIDATE_GUIDE.md`. Compare the reviewer output to the ground truth before marking a phase complete.

Specifically, after Phase 1 you should be able to look at the reviewer report and immediately tell:
- Marcus Webb from Robert Kane (both CEO)
- Priya Kumar from Lucy Chen (both Marketing Engineer)
- Amanda Fox's integrity pattern from her surface-level positivity
- James Wong as behaviourally-fine-but-wrong-role

If any of those four distinctions are not clear from the synthesised view alone (without drilling into raw responses), the synthesis layer is not working.
