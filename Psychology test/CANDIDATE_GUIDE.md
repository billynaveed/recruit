# Test Candidate Guide — YFS Psychometric Scoring Validation

This folder contains 8 candidate PDF reports for testing the YFS scoring pipeline. Pass these to Claude Opus to evaluate whether the psychometric assessment and AI scoring is correctly identifying candidate quality.

---

## How to Use

Each PDF is a full candidate report including:
- Role-specific question answers
- Standard question answers
- Psychometric assessment data (FC tallies, T1 ranking, T2 choice, consistency checks)
- STAR behavioural responses with AI rubric band estimates
- Final reflection

Ask Opus to evaluate each candidate's suitability for the role (CEO or Marketing Engineer) based solely on the content of the report, then compare its assessment to the ground truth below.

---

## CEO Position — 4 Test Candidates

### ✅ CEO_STRONG__Marcus_Webb.pdf
**Profile:** Marcus Webb  
**Ground truth:** STRONG — Should shortlist  
**Why strong:**
- STAR answers are highly specific, first-person, with concrete measurable outcomes
- Genuine ownership of failures (corrected board with wrong projections, named own process failure)
- Changed mind with real evidence (junior colleague's data on retention/expansion)
- FC pattern: conscientiousness=4, honesty_humility=4, composure=2 — high alignment with CEO profile
- T1 ranking: mission > scope > autonomy > stability — correct motivation for this role
- T2: Option A (flagged flaw openly in meeting) — maximum honesty signal
- CC1: 1, CC2: 1 — no consistency flags, strongly disagrees with both negative statements
- **Expected AI bands:** strong_positive or unusually_strong across all STAR items

---

### ⚠️ CEO_MEDIOCRE__Patricia_Wu.pdf
**Profile:** Patricia Wu  
**Ground truth:** MEDIOCRE — Borderline, should not shortlist without significant further probing  
**Why mediocre:**
- STAR answers lack specificity: vague timelines, passive framing ("some challenges", "adjusted")
- No genuine ownership of failure — blames "external factors" or just absorbs quietly
- Changed mind example shows deference rather than genuine intellectual update
- FC pattern: interpersonal=4, conscientiousness=3 — interpersonal-heavy but lacks edge
- T1 ranking: autonomy > stability > scope > mission — wrong motivation order for a CEO (stability first is a red flag)
- T2: Option B (delays to fix privately) — moderate honesty, avoids transparent disclosure
- CC1: 3, CC2: 3 — neither — ambiguous signal, not a flag but not reassuring
- **Expected AI bands:** mixed or limited_signal on most STAR items

---

### ❌ CEO_UNSUITABLE1__Robert_Kane.pdf
**Profile:** Robert Kane  
**Ground truth:** UNSUITABLE — Do not progress  
**Why unsuitable:**
- Blame-shifter: consistently attributes failures to team members, contractors, others
- No authentic self-reflection — mistakes are always "other people's errors"
- Feedback delivery example is vague and lacks genuine care for the recipient
- FC pattern: interpersonal=4, learning=3 — appears open-minded but STAR answers contradict this
- T1 ranking: scope > autonomy > stability > mission — prestige and control first, mission last
- T2: Option D (mentions flaw only if asked) — lowest possible honesty signal
- CC1: 4, CC2: 4 — agrees he leaves tasks and inflates completeness — serious consistency flag against his leadership narrative
- **Expected AI bands:** limited_signal or mixed on STAR items; flagged for external attribution

---

### ❌ CEO_UNSUITABLE2__Amanda_Fox.pdf
**Profile:** Amanda Fox  
**Ground truth:** UNSUITABLE — Do not progress  
**Why unsuitable:**
- Self-serving framing throughout: reframes mistakes as choices, failures as "learnings"
- Zero genuine ownership of any outcome — always presents herself as the reason things worked
- Feedback delivery prioritises relationship preservation over honesty ("emotional intelligence is everything")
- FC pattern: conscientiousness=4, interpersonal=4 — appears structured and people-oriented, but CC flags undercut both
- T1 ranking: scope > autonomy > stability > mission — recognition and control before mission
- T2: Option C (shares analysis but fixes flaw quietly) — avoids transparency to protect image
- CC1: 5, CC2: 5 — strongly agrees with both negative statements — massive consistency flag; STAR answers claim reliability but she self-reports as unreliable and deceptive
- **Expected AI bands:** mixed or limited_signal on STAR items; highest possible CC flag severity

---

## Marketing Engineer Position — 4 Test Candidates

### ✅ ME_STRONG__Priya_Kumar.pdf
**Profile:** Priya Kumar  
**Ground truth:** STRONG — Should shortlist  
**Why strong:**
- Has actually built things: Make/Notion automation for freelance tracking, Python scraper, Slack bot
- Content project has genuine creative specificity and measurable outcome (3x engagement, event sign-up record)
- Understands AI at a technical level (prompt engineering, Runway, ElevenLabs) — not just a user
- Campaign answer is concrete and specific (LinkedIn, £300 ad spend, measurement plan)
- STAR answers are honest, first-person, specific — genuinely owns a mistake with a client
- FC pattern: honesty_humility=4, conscientiousness=3, learning=3 — very strong profile for this role
- T1: mission > autonomy — mission-driven, wants ownership, right fit for YFS
- T2: Option A — maximum honesty
- CC1: 2, CC2: 1 — no flags
- **Expected AI bands:** strong_positive or unusually_strong on STAR items

---

### ⚠️ ME_MEDIOCRE__Tom_Bradley.pdf
**Profile:** Tom Bradley  
**Ground truth:** MEDIOCRE — Unlikely fit; may have potential with time but not ready  
**Why mediocre:**
- Has used tools (Buffer, Canva, ChatGPT for drafts) but hasn't built anything
- No automation or technical project — tool adoption without creation
- AI answer is observational ("keeping an eye on how things develop") — no active engagement
- Campaign answer is generic ("social media," "boosted post") — no specificity or insight
- STAR answers are thin and vague — mistakes described as "fine in the end"
- FC pattern: interpersonal=4, conscientiousness=3 — competent and agreeable but no standout signal
- T1: stability > autonomy — wants predictability; tension with YFS's high-ownership culture
- T2: Option B — delays to fix privately, some honesty but avoids transparency
- CC1: 3, CC2: 3 — neutral
- **Expected AI bands:** limited_signal or mixed on STAR items

---

### ❌ ME_UNSUITABLE1__Lucy_Chen.pdf
**Profile:** Lucy Chen  
**Ground truth:** UNSUITABLE — Wrong profile for this role  
**Why unsuitable:**
- Traditional marketer with no AI fluency or technical interest
- Explicitly states "authentic human connection" over technology — actively resistant to the role's direction
- Campaign answer proposes a "local event" with no digital or AI component — tone-deaf to the brief
- No automation or build experience whatsoever (Canva + Hootsuite is the extent of it)
- STAR answers are passive and conflict-avoidant — defers to authority even when she disagrees
- FC pattern: interpersonal=4, conscientiousness=4 — reliable and people-focused but wrong for this role
- T1: stability > scope — lowest-risk orientation
- T2: Option C — shares quietly and fixes without disclosure
- CC1: 4 — agrees she leaves tasks unfinished
- **Expected AI bands:** limited_signal across STAR items; role Q&A should clearly signal wrong fit

---

### ❌ ME_UNSUITABLE2__James_Wong.pdf
**Profile:** James Wong  
**Ground truth:** UNSUITABLE — Wrong direction of fit (tech without marketing instinct)  
**Why unsuitable:**
- Strong technical skills but zero creative or marketing instinct
- AI answer focuses on transformer architectures — correct interest but completely wrong application lens
- Campaign answer is "set up tracking infrastructure" — no understanding of audience, message, or story
- No evidence of creative output, content creation, or audience thinking
- STAR answers are technically clean but interpersonally flat — all from pure engineering context
- FC pattern: conscientiousness=4, honesty_humility=4 — genuinely reliable and honest, but wrong role
- T1: autonomy > mission — wants independence but mission-alignment is secondary
- T2: Option A — good honesty signal (best quality in otherwise wrong-fit candidate)
- CC1: 1, CC2: 1 — no flags (genuinely conscientious — just wrong profile)
- **Expected AI bands:** limited_signal on STAR items (technically adequate but lacks marketing context)

---

## What to Ask Opus

Suggested prompt structure:

> "I am evaluating a candidate assessment system that combines psychometric data with AI rubric scoring. Here are [N] candidate reports for the [CEO / Marketing Engineer] role at Young Founders School. For each candidate:
> 1. Rate their suitability as: Strong / Borderline / Unsuitable
> 2. Identify the 2-3 strongest signals (positive or negative) that drove your assessment
> 3. Note any surprises or inconsistencies between their stated behaviour and their psychometric data
>
> [Attach PDFs]"

Then compare Opus's ratings to the ground truth above to assess whether the scoring pipeline is correctly differentiating between candidate profiles.

---

## Scoring Pipeline Status

All 8 candidates have been scored by the YFS AI rubric (Anthropic Claude Sonnet).

| Candidate | Role | Ground Truth | AI Scoring |
|---|---|---|---|
| Marcus Webb | CEO | Strong | C-S1–C-S4 scored |
| Patricia Wu | CEO | Mediocre | C-S1–C-S4 scored |
| Robert Kane | CEO | Unsuitable | C-S1–C-S4 scored |
| Amanda Fox | CEO | Unsuitable | C-S1–C-S4 scored |
| Priya Kumar | ME | Strong | C-S1–C-S4 scored |
| Tom Bradley | ME | Mediocre | C-S1–C-S4 scored |
| Lucy Chen | ME | Unsuitable | C-S1–C-S4 scored |
| James Wong | ME | Unsuitable | C-S1–C-S4 scored |

Admin URLs (internal access):
- Marcus Webb: `/admin/candidates/cmo54aqfe0001ar6j0j46bck3`
- Patricia Wu: `/admin/candidates/cmo54aqfr0004ar6j4mtyix4z`
- Robert Kane: `/admin/candidates/cmo54aqg00007ar6jjd5vtbx5`
- Amanda Fox: `/admin/candidates/cmo54aqg7000aar6jt2gx724s`
- Priya Kumar: `/admin/candidates/cmo54b7p50007fj6jgy6qrz4z`
- Tom Bradley: `/admin/candidates/cmo54b7pf000afj6j8jk3eaqi`
- Lucy Chen: `/admin/candidates/cmo54b7pm000dfj6j2yki79ct`
- James Wong: `/admin/candidates/cmo54b7ps000gfj6jtg4ct0l5`
