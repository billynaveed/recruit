# Phase 5 — Operational hygiene

**Goal:** Make the scoring pipeline, reviewer view, and admin surfaces robust for actual use. Addresses scoring failures, audit logging, versioning, and monitoring.

---

## 5.1 Scoring failure handling (fix the Patricia Wu bug)

### Current problem

Patricia Wu's C-S3 response returned `scoring_failed` with no rubric features populated and no user-visible indication of what happened. This is a silent failure that either:
- A primary-model call returned malformed output and the fallback cascade did not trigger, OR
- The fallback cascade triggered but all three fell through, OR
- A transient error was caught and swallowed

### Required behaviour

1. **Every scoring failure is logged** with: candidate_id, item_id, timestamp, model attempted at each stage, error returned at each stage, final outcome.
2. **Fallback cascade must always trigger on failure** of the primary. If GLM returns malformed JSON, retry parse once; if still malformed, fall to Gemma. If Gemma fails, fall to Sonnet. If Sonnet fails, mark as `scoring_failed` and surface.
3. **`scoring_failed` is visually surfaced** in the reviewer view as an operational flag with a retry action.
4. **Retry action** is a button in the operational flag card. Clicking re-invokes the scoring pipeline for that specific item only, using Sonnet directly (skip the cascade for retries — the primary already failed once). Log the retry attempt.
5. **Repeated failures on the same item across 3+ retries** surface to an admin dashboard for manual review.

### Diagnostic for Patricia Wu specifically

Before implementing the general fix, investigate the exact cause of Patricia Wu's C-S3 failure. The response text looks scoreable to a human. Likely causes:
- Model returned JSON with fields renamed
- Model returned a wrapped response (e.g., with markdown fences) that the parser didn't strip
- Fallback never triggered because the parse succeeded on empty content

Write a small diagnostic that re-runs Patricia Wu's C-S3 through each model in the cascade and logs what each returns. Fix the root cause, then re-score her C-S3 and verify.

---

## 5.2 Versioning and model locking

Per `psychology_assessment_module_spec.md` §5.5 and §8.2, versioning is required, not optional.

### What must be versioned

- **Item content:** every item has a version. Silent edits in production are not allowed.
- **Rubrics:** every rubric has a version. Rubric edits produce a new version; old scores remain tagged to the old version.
- **Scoring prompts:** prompt templates versioned separately from rubrics.
- **Models:** specific model version locked per rubric version (e.g., `glm-4.5`, `claude-sonnet-4-5-20250514`, `gemma-2-9b-it`).
- **Bundles:** role-family bundles versioned — a candidate took bundle v1.2; we remember which items were in v1.2.

### Data model additions

```typescript
type ScoringRun = {
  id: string
  candidate_id: string
  item_id: string
  rubric_version: string
  scoring_prompt_version: string
  model_used: string
  model_version: string
  attempted_models: Array<{model: string, outcome: 'success' | 'parse_fail' | 'error', error_message?: string}>
  raw_llm_response: text
  parsed_features: object
  scored_at: timestamp
}
```

Every dimension estimate, flag, and summary traces back to specific scoring runs. When a rubric or model is updated, old reports are not silently re-scored — they remain at their original version with a clear indicator.

### Re-scoring

When a rubric or prompt is updated to a new version, provide an admin action to re-score a candidate or a set of candidates against the new version. The UI shows both scores side-by-side until the reviewer accepts one.

---

## 5.3 Audit logging

Every reviewer-visible action logged:

- When a report was generated
- When a report was viewed (by whom, when)
- When a flag was overridden or dismissed by a reviewer
- When a follow-up question was regenerated
- When scoring was retried
- When a dimension estimate was manually overridden (if this is allowed — it probably shouldn't be, but if it is, it's audit-logged)

Retention: aligned to GDPR and applicable jurisdiction rules. Document the retention policy in product admin settings.

---

## 5.4 Subgroup monitoring hook

Per `psychology_assessment_module_spec.md` §8.10, scoring must support subgroup analysis for adverse-impact monitoring.

### v1 implementation

Add a hook in the scoring pipeline: when a dimension estimate is produced, write an anonymous record to a `subgroup_analysis` table with:
- Dimension
- Band assigned
- Candidate demographic attributes (if collected lawfully and with consent — opt-in only, off by default)
- Role family
- Timestamp

This creates the data foundation. A dashboard that visualises subgroup band distributions is a v1.5 feature, but the data collection starts at v1 so you have the historical record when you need it.

---

## 5.5 Data retention and candidate rights

Build into the admin/candidate surface:

- A **"Request deletion"** action that candidates can invoke (email link or similar), triggering a workflow that:
  - Deletes candidate PII from active tables
  - Anonymises or deletes response text per legal requirements
  - Retains anonymised aggregate scoring data for subgroup monitoring where lawful
- A **"Request human review"** action for candidates (GDPR Article 22 compliance), routing a notification to the hiring manager with the candidate's full report and a requirement to document the human decision.

---

## 5.6 Admin dashboard additions

At `/admin` or `/admin/operations`, expose:

- **Scoring health:** pass rate over last 24h / 7d / 30d, broken down by model and item
- **Failed scoring queue:** items where scoring has failed 3+ times, awaiting manual review
- **Reviewer action log:** recent regenerations, overrides, dismissals
- **Version status:** current rubric versions, current model versions, last rubric update date
- **Candidate throughput:** assessments started / completed / abandoned over time

These are operational views, not primary product surfaces. Keep them simple.

---

## 5.7 Documentation

Create in-repo documentation at `/docs/`:

- `/docs/scoring-pipeline.md` — how the scoring pipeline works, including the fallback cascade, versioning, and how to add a new rubric
- `/docs/reviewer-interpretation-guide.md` — a 1-page guide for hiring managers on how to read the reviewer report, with emphasis on: uncertainty framing, role-fit as summary not decision, and follow-up interview questions as primary output. This is the doc referenced in `psychology_assessment_module_spec.md` §8.5.
- `/docs/adding-items.md` — how to add a new item to the library, including tagging, versioning, and piloting process

---

## 5.8 Testing — do not mark Phase 5 complete until

1. Patricia Wu's C-S3 scores successfully on retry (after root-cause fix)
2. A deliberate scoring failure (e.g., return malformed JSON from the primary model in a test harness) triggers the full fallback cascade and logs every attempt
3. An item scored today can be viewed alongside its rubric version, model version, and prompt version
4. Admin dashboard loads the scoring health metrics in under 2 seconds
5. A candidate deletion request removes PII within the documented SLA (manual trigger for now; automated workflow can come later)
6. The reviewer interpretation guide exists and is linked from the admin surface
