# Phase 4 — Cross-candidate comparison view

**Goal:** When reviewing 4–10 candidates for a role, the hiring manager should be able to scan them on one screen and decide who to prioritise — without opening 10 individual reports.

---

## 4.1 When this view is shown

A new page at `/admin/roles/{role_id}` (or similar). Shows all candidates who have completed the assessment for that specific role.

Default sort: by submission date, descending. Other sorts available: by role-fit band, by number of high-severity flags, alphabetical.

---

## 4.2 Layout

A scannable table-like grid, one row per candidate. Each row summarises the 60-second panel.

### Columns

```
│ Candidate        │ Submitted │ Role-fit │ Confidence │ Flags │ Top strength │ Top concern │
│──────────────────│───────────│──────────│────────────│───────│──────────────│─────────────│
│ Marcus Webb      │ 19 Apr    │ Strong   │ rich       │  0    │ {1-line}     │ —           │
│ Priya Kumar      │ 19 Apr    │ Strong   │ rich       │  0    │ {1-line}     │ —           │
│ Patricia Wu      │ 19 Apr    │ Mixed    │ moderate   │  2    │ —            │ {1-line}    │
│ Tom Bradley      │ 19 Apr    │ Mixed    │ moderate   │  2    │ —            │ {1-line}    │
│ Lucy Chen        │ 19 Apr    │ Weak     │ moderate   │  2    │ —            │ {1-line}    │
│ James Wong       │ 19 Apr    │ Weak     │ moderate   │  1    │ —            │ {1-line}    │
│ Robert Kane      │ 19 Apr    │ Mis-fit  │ rich       │  4    │ —            │ {1-line}    │
│ Amanda Fox       │ 19 Apr    │ Mis-fit  │ rich       │  4    │ —            │ {1-line}    │
```

Each row is clickable and navigates to the individual report.

### Top strength / top concern

- **Top strength:** the highest-priority strength bullet from their 60-second panel
- **Top concern:** the highest-severity flag's label, truncated to ~10 words. If no flags, show an em-dash.

Keep text short. The grid is for scanning, not reading.

### Role-fit display

Same labels as the individual report: Strong fit / Likely fit / Mixed fit / Weak fit / Likely mis-fit. Use consistent visual treatment — the same left-border accent as flags in the individual report.

---

## 4.3 Filters and sorting

Filters (as chips or dropdowns above the grid):

- **Role-fit band:** multi-select (default: all)
- **Has flags:** yes / no / all
- **Assessment completion:** complete / incomplete
- **Date range:** last 7 days / last 30 days / all time

Sorting:

- Submission date (newest first — default)
- Role-fit band (Strong → Mis-fit, or reverse)
- Flag count
- Candidate name alphabetical

---

## 4.4 Bulk actions (v1.5 — optional)

Not required for first ship, but plan the data model to support:

- Export a shortlist of candidates to a CSV for the hiring team
- Bulk status update (e.g., mark as "progressed to interview" or "declined")
- Tagging

---

## 4.5 Anti-patterns to avoid in this view

- **No composite "overall score" column.** There is no overall score. Role-fit band is the summary; flag count is a second signal.
- **No ranking by a single metric.** Sort by band + flag count gives an ordering, but don't show "Ranked #1, #2, #3" — that's false precision.
- **No averaged dimension scores across candidates.** Each candidate is an individual profile, not a data point in a cohort.
- **No leaderboard aesthetics.** This view is a working list, not a competition.

---

## 4.6 Testing — do not mark Phase 4 complete until

With all 8 seeded candidates in the grid:

1. From the grid alone, a hiring manager should be able to identify the 2 strong candidates (Marcus Webb, Priya Kumar for their respective roles) within 10 seconds.
2. Amanda Fox and Robert Kane should both show as Likely mis-fit with 3–4 flags each — visually distinct from the mediocre-but-not-concerning candidates.
3. James Wong and Lucy Chen should both show Weak fit with 1–2 flags — a hiring manager should be able to tell from the grid that these are role-fit issues, not behavioural concerns (easier once they click through; the grid gives the shape).
4. Grid should load quickly — all data needed for the grid should come from the dimension estimates and flag tables, not from re-running the scoring pipeline.
