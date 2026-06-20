# Role-Family Bundles — v1 Draft

**Companion to:** `psychology_assessment_module_spec.md` and `core_items_v1_draft.md`
**Status:** v1 draft, unreviewed by psychologist, unpiloted
**Scope:** Role-family block and role-specific block (~30% + ~10% of instrument) for a company with "engineer mindset for all roles" framing

---

## READ FIRST — Company-specific framing and scope

### What this document assumes about the company
These bundles are built for a company that:
- Is AI-first and technical-first in its operating approach
- Expects **every role** (not just engineering) to operate with an engineer mindset — systems thinking, build-over-buy bias, automation orientation, iteration discipline
- Treats domain expertise (marketing, ops, sales, community) as a layer on top of technical/AI fluency, learnable after hire
- Is hiring at early-to-mid seniority bands for first few roles, founder-present

This is a non-universal framing. If the product is later sold to companies that hire traditional marketers, ops leads, etc., these bundles need to be replaced with conventional role-family bundles for those customers. This is a configuration choice, not a product limitation.

### Known limitations
Same as the core items draft:
1. Not reviewed by a trained psychologist
2. Not piloted on real candidates
3. SJT answer keys are based on judgment, not on subject-matter-expert consensus (which is the gold standard for SJT scoring). Expect to iterate once you have real responses.
4. Desirability calibration still required on any forced-choice items
5. Rubric prompts need iteration against real responses

### Role families covered
| Family | Billy's first hire? | Notes |
|---|---|---|
| Marketing Engineer | ✅ first hire priority | Full bundle with tooltips |
| Engineering | — | Full bundle (different frame — no engineer-mindset probes) |
| Operations Engineer | — | Template + role-specific item |
| Sales Engineer (non-standard usage) | — | Template + terminology note |
| Community Engineer | — | Template + role-specific item |

### Structural convention
- **Shared items** (🔗): used in all non-engineering bundles. Configured once, appear in multiple bundles via role-family tag.
- **Engineering items** (🛠️): used only in Engineering bundle.
- **Role-specific items** (🎯): unique to a single bundle.

---

## Section 1 — Shared Items (all non-engineering bundles)

Four items appear in every non-engineering bundle: Marketing Engineer, Ops Engineer, Sales Engineer, Community Engineer. They probe engineer mindset and AI fluency — the traits Billy wants present in every hire regardless of function.

---

### Item RF-S1 🔗 — Engineer mindset under constraint (SJT)

**Item type:** `sjt`
**Layer:** `role_family`
**Construct (primary):** `learning` (applied: systems thinking)
**Construct (secondary):** `conscientiousness` (applied: build-to-reuse orientation)
**Role families:** marketing_eng, ops_eng, sales_eng, community_eng
**Seniority bands:** early_career, mid

**Prompt shown to candidate:**
> You've been asked to deliver a specific output for the company — say, a weekly report, a pipeline of content, a regular analysis, or a recurring process. It needs to happen every week for the foreseeable future.
>
> You have four weeks to get it running. Which approach is **most** like how you'd handle this, and which is **least** like how you'd handle it?
>
> **A.** Do it manually for the first few weeks. Once I understand the work, look for parts to systematize or automate.
> **B.** Design and build a small system or tool upfront that does most of the work. Launch once it's ready.
> **C.** Hire a contractor or use an external service to handle the recurring work, and focus my time elsewhere.
> **D.** Build a basic version in week one, use it, then improve it each week based on what I learn.

**Answer mapping:**
```
Best:  D (+2)  — iterative build, fastest learning, systems orientation + humility about uncertainty
       B (+1)  — strong build orientation but front-loads design before learning
       A (0)   — reasonable, but domain-first rather than systems-first
       C (-1)  — outsources the learning; anti-engineer-mindset for this company
Worst: C (+2)  — strongest signal of anti-systems orientation
       A (+1)  — weak systems signal
       B (0)   — reasonable alternative; waterfall build
       D (-1)  — picking iterative-build as worst is a meaningful negative signal
```

**Reviewer output contribution:** Adds to engineer-mindset profile. Candidates who pick D as best and C as worst are displaying the preferred pattern.

**Tooltips** (candidate hovers to see):
- **"Systematize or automate"**: build a tool, script, template, or workflow so the task runs with less manual effort next time.
- **"Small system or tool"**: could be a spreadsheet with formulas, a script, an automation workflow, or a simple piece of software — not necessarily a large engineering build.
- **"Contractor or external service"**: outsourcing the ongoing work to someone else, rather than doing or building it yourself.

---

### Item RF-S2 🔗 — AI fluency and limits (SJT)

**Item type:** `sjt`
**Layer:** `role_family`
**Construct (primary):** `learning` (applied: AI tool fluency)
**Construct (secondary):** `honesty_humility` (applied: epistemic humility with AI output)
**Role families:** marketing_eng, ops_eng, sales_eng, community_eng
**Seniority bands:** early_career, mid

**Prompt shown to candidate:**
> You're using an AI assistant to help with a task. It gives you a confident, well-written answer that would save you several hours of work if you used it directly.
>
> Which approach is **most** like what you'd do, and which is **least**?
>
> **A.** Use it as-is. The AI is usually right, and the time saved is the point.
> **B.** Read it carefully, check the parts where being wrong would matter most, and verify those before using.
> **C.** Verify every claim from scratch before using any of it.
> **D.** Use it as a draft, rewrite the parts I have opinions on, and cross-check anything that involves specific facts or numbers.

**Answer mapping:**
```
Best:  D (+2)  — iterative AI collaboration with selective verification; shows both fluency and limits awareness
       B (+1)  — risk-weighted verification; also strong
       C (0)   — thorough but defeats the AI's purpose; may indicate low AI fluency
       A (-2)  — strong anti-signal; no awareness of AI failure modes
Worst: A (+2)
       C (+1)  — picking "verify everything" as worst shows AI fluency
       B (-1)
       D (-2)
```

**Tooltips:**
- **"AI assistant"**: any AI tool you'd use for work — ChatGPT, Claude, an AI coding tool, or similar.
- **"Being wrong would matter most"**: parts of the answer where a mistake would have real consequences — a wrong fact in a customer email, a miscalculated number in a report, a broken line of code.
- **"Cross-check"**: look up the facts or numbers in a source you trust, separately from the AI.

**Reviewer note:** This item is moderately face-valid at the extremes (A is obviously weak; C is obviously over-cautious). Signal quality depends on the distribution of D vs. B choices, which reflects genuine judgment differences.

---

### Item RF-S3 🔗 — AI tool usage in real work (STAR behavioral)

**Item type:** `star_behavioral`
**Layer:** `role_family`
**Construct (primary):** `learning` (applied: AI fluency)
**Construct (secondary):** `conscientiousness` (applied: systematic workflow building)
**Role families:** marketing_eng, ops_eng, sales_eng, community_eng
**Seniority bands:** early_career, mid

**Prompt shown to candidate:**
> Describe something specific you've done in the last 6 months where you used AI tools to do meaningful work — not just to ask a quick question, but to actually produce something or solve a real problem.
>
> Walk me through what you were trying to do, what tools you used, what your actual workflow looked like, and where the AI was helpful vs. where it wasn't.

**Expected response time:** 4–6 minutes
**Minimum response length before scoring:** 200 characters

**Tooltips:**
- **"Meaningful work"**: a piece of work that took more than a few minutes and had a real outcome — a project, a deliverable, a problem you actually solved.
- **"Your actual workflow"**: the steps you took. Did you iterate, combine tools, structure prompts in a particular way, check outputs?
- **"Where it wasn't [helpful]"**: where AI failed, got things wrong, or where you had to work around its limits.

**Rubric features (LLM-extracted):**

```
F1. Specificity of the work described
    HIGH: specific project, specific tools named, concrete outputs described.
    MEDIUM: some specifics but mixed with abstraction.
    LOW: generic description of "using AI" without real project detail.
    Return exactly one word: high, medium, or low.

F2. Depth of AI workflow described
    SOPHISTICATED: describes iteration, prompt structuring, chaining tools, building a workflow
                   or pipeline, or integrating AI into a broader process.
    BASIC: describes straightforward AI use (ask → receive → use) without iteration or structure.
    SURFACE: describes AI use as one-off queries without workflow thinking.
    Return exactly one word: sophisticated, basic, or surface.

F3. Limits awareness
    EXPLICIT: candidate describes specific AI failure modes they encountered and how they handled them.
    IMPLICIT: candidate shows awareness of AI limits without specific failure examples.
    ABSENT: candidate describes AI as uniformly useful with no acknowledgment of limits.
    Return exactly one word: explicit, implicit, or absent.

F4. Outcome specificity
    CONCRETE: specific output or result described.
    VAGUE: outcome referenced without specifics.
    MISSING: no outcome described.
    Return exactly one word: concrete, vague, or missing.

F5. Ownership and agency
    HIGH: candidate clearly drove the work; AI was a tool they directed.
    MEDIUM: candidate participated with AI; mixed ownership.
    LOW: candidate describes AI as having done the work, with their role unclear.
    Return exactly one word: high, medium, or low.
```

**Dimension signal rules:**
```
AI Fluency signal (contributes to Learning Orientation):
  strong_positive  if F1=high AND F2=sophisticated AND F3=explicit AND F4=concrete
  moderate_positive if F1=high AND F2≥basic AND F3≥implicit AND F4≥vague
  mixed            if F2=surface OR F3=absent
  concern_flag     if F5=low (candidate may be dependent on AI rather than directing it)
  limited_signal   if F1=low OR F4=missing OR response below minimum length
```

**Reviewer-facing callout:** This item is the single strongest signal of whether the candidate actually uses AI in their work or just claims to. Pay attention to the specifics — named tools, described workflows, failure modes encountered.

---

### Item RF-S4 🔗 — Engineer vs. Domain tradeoff

**Item type:** `tradeoff`
**Layer:** `role_family`
**Construct (primary):** `motivation` (applied: self-identity as builder vs. specialist)
**Role families:** marketing_eng, ops_eng, sales_eng, community_eng
**Seniority bands:** early_career, mid

**Prompt shown to candidate:**
> Imagine two roles. Both pay the same. Both are at companies you respect.
>
> **Role 1:** You're a domain specialist. Your job is to be excellent at [marketing / operations / sales / community — whichever matches the role you're applying for]. You use AI and tools, but the core of your value is your domain expertise.
>
> **Role 2:** You're an engineer-builder who happens to work on [marketing / operations / sales / community]. Your job is to build systems, automate, and leverage AI to do the work of several specialists. You'll learn the domain in depth over time.
>
> Which role is more appealing to you?
>
> ☐ Strongly prefer Role 1
> ☐ Lean toward Role 1
> ☐ Genuinely split
> ☐ Lean toward Role 2
> ☐ Strongly prefer Role 2

**Scoring:**
```
Engineer-mindset fit for this company:
  Strongly Role 2 → strong_positive
  Lean Role 2     → moderate_positive
  Split           → mixed
  Lean Role 1     → concern_flag (may be domain-identity hire, not engineer-mindset hire)
  Strongly Role 1 → negative_fit (likely mis-fit for this company's frame)
```

**Tooltips:**
- **"Domain specialist"**: someone whose main value is deep skill in a specific field (e.g., "senior content marketer" or "operations lead with 10 years in SaaS").
- **"Engineer-builder"**: someone who approaches problems by building systems and workflows, often using code, automation, or AI tools.
- **"Genuinely split"**: you honestly find both roles equally appealing — not a way to avoid choosing.

**Candidate-experience note:** This item is the single most face-valid item in the instrument — candidates can see clearly what's being asked. That's intentional. The goal is not to measure engineer-mindset covertly; it's to give honest self-selection. Candidates who lean Role 1 are telling you something useful, and the right response is often to thank them and recommend a different company rather than to hire them into a role they'd dislike.

---

## Section 2 — Engineering Bundle (for Engineering role)

Engineering hires already have the engineer mindset by definition; probing for it doesn't discriminate among them. The Engineering bundle substitutes different items.

---

### Item RF-E1 🛠️ — Technical judgment under uncertainty (SJT)

**Item type:** `sjt`
**Layer:** `role_family`
**Construct (primary):** `conscientiousness` (quality-facet)
**Construct (secondary):** `honesty_humility`
**Role families:** engineering
**Seniority bands:** mid, senior

**Prompt shown to candidate:**
> You're 80% done with a feature. While finishing it, you realize the approach you chose two weeks ago has a significant flaw — it'll work for the immediate use case but will cause problems within 3–6 months if the product scales as planned.
>
> Fixing it properly means throwing away most of the work and rebuilding. Shipping it as-is means the feature goes out this week.
>
> Rank these actions from most to least like what you'd do:
>
> - **A.** Ship it, document the flaw and the mitigation plan, and schedule the rebuild as a priority follow-up.
> - **B.** Stop, rebuild it correctly, and miss the deadline.
> - **C.** Ship it, plan to revisit if and when the scaling problem actually materializes.
> - **D.** Stop, flag it to whoever's making the decision about the timeline, and get their input before deciding.

**Answer mapping:**
```
Expected best responses (strong positive):
  D first (defers judgment upward, shows collaborative decision-making)
  A second (pragmatic + transparent)
Expected concerning responses:
  C first (ship-and-hope) → concern_flag on conscientiousness
  B first with no mention of stakeholder input → possible over-indexing on technical purity

Scoring: rank ordering, with flags for (C first) or (A last AND D last).
```

**Tooltips:**
- **"Significant flaw"**: a problem that will cause real issues later, but that works for now.
- **"Scaling"**: the product being used by more people, processing more data, or being used in ways it isn't today.
- **"Rebuild it correctly"**: doing it the right way from scratch, rather than patching the existing approach.

---

### Item RF-E2 🛠️ — AI-assisted engineering (SJT)

**Item type:** `sjt`
**Layer:** `role_family`
**Construct (primary):** `learning` (applied: AI-coding fluency)
**Construct (secondary):** `honesty_humility` (applied: epistemic discipline)
**Role families:** engineering
**Seniority bands:** mid, senior

**Prompt shown to candidate:**
> You're using an AI coding assistant. It produces a 200-line solution to the problem you described. The code looks clean and runs without errors on your quick test.
>
> Which approach is **most** like what you'd do before committing this code?
>
> **A.** If it runs and the output looks right, commit it.
> **B.** Read through it line by line, make sure I understand every part, and test edge cases I can think of.
> **C.** Have the AI explain each section, then spot-check the parts that touch anything critical (auth, data handling, external APIs).
> **D.** Rewrite the parts I have strong opinions about, keep the parts that match how I'd do it, and test the full thing against the requirements.

**Answer mapping:**
```
Best:  D (+2)   — engaged, opinionated review; uses AI as draft
       B (+1)   — thorough but may be over-cautious / slow
       C (+1)   — risk-weighted spot-check, good judgment
       A (-2)   — strong anti-signal for AI-coding discipline
Worst: A (+2)
       B (-1)   — picking "read line by line" as worst is a reasonable fluency signal
```

**Tooltips:**
- **"Critical [code]"**: code that handles authentication, user data, payments, external systems, or anything where a bug could cause real damage.
- **"Spot-check"**: look carefully at specific parts rather than reviewing everything equally.

---

### Item RF-E3 🛠️ — Engineering project (STAR behavioral)

**Item type:** `star_behavioral`
**Layer:** `role_family`
**Construct (primary):** `conscientiousness` (technical mastery)
**Construct (secondary):** `learning`
**Role families:** engineering
**Seniority bands:** mid, senior

**Prompt shown to candidate:**
> Describe a specific technical project from the last 12 months where you made a non-obvious technical decision — something where the obvious choice would have been wrong, or where you chose a different approach than most people would have.
>
> What was the project, what was the decision, what was the obvious choice, and what did you choose instead and why?

**Expected response time:** 4–6 minutes

**Tooltips:**
- **"Non-obvious technical decision"**: a choice where the path most people would take was wrong for the situation, or where you considered several options and picked one for specific reasons.
- **"Obvious choice"**: what a reasonable engineer would default to if they weren't thinking carefully.

**Rubric features** (abbreviated — follows same structure as core STAR items):
- Specificity of project (high/medium/low)
- Specificity of decision described (high/medium/low)
- Depth of reasoning (first-principles / pattern-matched / asserted)
- Outcome clarity
- Intellectual honesty (did they describe the tradeoffs honestly, including downsides of their choice?)

---

### Item RF-E4 🛠️ — Engineering tradeoff

**Item type:** `tradeoff`
**Layer:** `role_family`
**Construct (primary):** `motivation`
**Role families:** engineering
**Seniority bands:** mid, senior

**Prompt shown to candidate:**
> Rank these, most preferred first — in a role you'd take:
>
> - Working on deep technical problems where the difficulty is the interest
> - Shipping fast and seeing real users benefit from what you built
> - Building infrastructure and tools that multiply what other engineers can do
> - Working at the frontier of what's possible with current technology

**Scoring:** Contributes to Engineering-specific motivation profile, reported to reviewer.

---

## Section 3 — Marketing Engineer Bundle (first hire priority)

**Role family tag:** `marketing_eng`
**Seniority default:** `early_career`, `mid` (pick per role)

### Bundle composition

| Item | Source | Count |
|---|---|---|
| RF-S1 (Engineer mindset SJT) | shared | 1 |
| RF-S2 (AI fluency SJT) | shared | 1 |
| RF-S3 (AI tool STAR) | shared | 1 |
| RF-S4 (Engineer vs. domain tradeoff) | shared | 1 |
| RF-ME1 (Marketing-specific scenario) | role-specific | 1 |
| **Total role-family + role-specific** | | **5** |

Combined with core (~20 items), total instrument is ~25 items, ~25–30 minutes.

---

### Item RF-ME1 🎯 — Marketing engineer scenario (SJT + short response)

**Item type:** `sjt`
**Layer:** `role_specific`
**Construct (primary):** `learning` (applied: translating engineer-mindset into marketing problem)
**Construct (secondary):** `conscientiousness`
**Role families:** marketing_eng
**Seniority bands:** early_career, mid

**Prompt shown to candidate:**
> You've just joined the company. Your first project: the company needs to do outreach to a list of about 2,000 potential customers. Each one needs a message that references something specific about them (their company, their role, or recent activity). A person doing this manually would take ~40 hours. You have one week.
>
> Which of these is **closest** to how you'd approach the problem in your first 2 days? (Pick one.)
>
> **A.** Start sending manually, get a feel for what works, then decide if automation is worth it.
> **B.** Draft a clear spec for a small system: data source for the 2,000 contacts, AI-generated personalization per contact with a verification step, and a send workflow. Build a prototype on day 2.
> **C.** Find a tool or service that does personalized outreach, evaluate 2–3 options, and pick one.
> **D.** Break the list into segments, draft a template per segment, and send batched messages manually with some per-contact edits.
>
> Then briefly (2–4 sentences): what would you want to check about your approach **after** the first 200 messages go out?

**Answer mapping:**
```
A: -1  (domain-first, not system-first)
B: +2  (strong engineer-mindset signal; AI-integrated workflow)
C: 0   (build-vs-buy choice; defensible but not the preferred signal for this company)
D: -1  (template-and-batch, not system-build; weak AI leverage)

Plus rubric signal on the short response:
  - Mentions specific, measurable feedback signals (reply rates, negative replies, spam flags, output quality): +1
  - Mentions iterating the system based on first-batch signal: +1
  - Mentions stopping/pausing if quality is poor: +1 (shows epistemic honesty about AI output)
  - Generic "I'd check how it's going": 0
```

**Tooltips:**
- **"Personalization"**: each message references something specific about the recipient (their company, their role, or something they've recently done) rather than being a generic template.
- **"Verification step"**: a check that the AI-generated personalization is actually accurate and not hallucinated or generic.
- **"Batched messages"**: sending the same message (or close variant) to a group at once, rather than one-at-a-time.

**Candidate-experience note:** This item is practical and face-valid — a marketing engineer candidate should recognize it as representative of real work. The goal is not to trick them; it's to see how they actually think about a representative problem.

---

## Section 4 — Operations Engineer Bundle

**Role family tag:** `ops_eng`
**Seniority default:** `mid`

### Bundle composition
Same four shared items (RF-S1 to RF-S4), plus one role-specific:

### Item RF-OE1 🎯 — Operations engineer scenario (SJT + short response)

**Prompt shown to candidate:**
> The company has a recurring internal process that three people currently spend collective ~20 hours per week on: [e.g., compiling weekly investor updates / reconciling two data systems / processing routine requests]. It's boring, error-prone, and everyone wants it to go away.
>
> What's **your** first week look like? (Pick the option closest to your approach.)
>
> **A.** Shadow the three people for a few days to understand exactly what they do, then write a spec for automating it.
> **B.** Ask the three people for a written description of the process, and start building an automated version in parallel.
> **C.** Look for an existing off-the-shelf tool that solves the problem and propose buying it.
> **D.** Build a rough automation for the easiest 60% of the process in week one, use it, then expand based on what's still painful.
>
> Then briefly (2–4 sentences): what would make you decide to **stop** automating and just keep doing it manually?

**Answer mapping:**
```
A: +1  (thorough, may be too slow)
B: 0   (reasonable; risk of missing edge cases)
C: 0   (build-vs-buy; defensible)
D: +2  (iterative build, fastest learning)

Short-response signal:
  Mentions cost-benefit (e.g., process is infrequent, edge cases dominate, automation cost > manual cost): +1
  Mentions irreducible judgment components that shouldn't be automated: +1
  Mentions stakeholders who prefer the manual version for legitimate reasons: +1
  Doesn't consider stopping (always-automate bias): -1
```

**Tooltips:**
- **"Recurring internal process"**: work that has to happen regularly (weekly, monthly) that follows roughly the same steps each time.
- **"Off-the-shelf tool"**: a product you can buy or subscribe to that solves the problem, rather than building something custom.

---

## Section 5 — Sales Engineer Bundle

**Role family tag:** `sales_eng`
**Seniority default:** `mid`

### Terminology note (important)
"Sales Engineer" traditionally means a specific pre-sales technical role (someone who helps close technical sales by answering deep product questions). This company's usage is different: a salesperson who operates with engineer mindset — automating outreach, building systems for pipeline management, using AI for personalization and follow-up. If hiring externally, consider alternative titles to avoid confusion (e.g., "AI-first Sales Lead," "Growth Engineer," "Sales Systems Lead").

### Bundle composition
Same four shared items (RF-S1 to RF-S4), plus:

### Item RF-SE1 🎯 — Sales engineer scenario (SJT + short response)

**Prompt shown to candidate:**
> You own a pipeline target. The traditional approach at comparable companies is: SDR team does outreach, qualified leads go to an AE, AE runs calls and closes. You don't have an SDR team or an AE team — just you, and AI/automation tools.
>
> How do you think about building the pipeline? (Pick one.)
>
> **A.** Do the traditional playbook solo: I handle SDR work in the morning and AE work in the afternoon.
> **B.** Build an automated outreach system that handles the first-touch layer at scale, then personally handle any lead that responds meaningfully.
> **C.** Focus entirely on a small set of high-value targets and work them deeply, since automation tends to produce noise.
> **D.** Build an outreach + triage system that qualifies responses, then personally handle only the leads the system flags as real.
>
> Then briefly (2–4 sentences): what's one thing you would NOT automate in a sales process, and why?

**Answer mapping:**
```
A: -1  (replicates old model manually; doesn't use the leverage of the tools)
B: +1  (strong automation; risk of noise)
C: 0   (deep-targeting; legitimate approach but not engineer-mindset-first)
D: +2  (system + human judgment in the right places)

Short-response signal:
  Identifies a high-stakes human-judgment moment (e.g., closing conversation, complex objection handling, pricing negotiation): +2
  Identifies relationship-building in complex deals: +1
  Says "nothing, automate everything": -2 (no epistemic humility about AI limits)
```

**Tooltips:**
- **"SDR"**: Sales Development Representative — the role that does outbound prospecting and first-touch outreach.
- **"AE"**: Account Executive — the role that handles qualified leads, runs sales calls, and closes deals.
- **"Triage"**: a system that sorts incoming responses into categories (real lead / not real / needs human).

---

## Section 6 — Community Engineer Bundle

**Role family tag:** `community_eng`
**Seniority default:** `early_career`, `mid`

### Bundle composition
Same four shared items (RF-S1 to RF-S4), plus:

### Item RF-CE1 🎯 — Community engineer scenario (SJT + short response)

**Prompt shown to candidate:**
> The company has a community of ~3,000 members across Discord, Slack, and an email list. Engagement has been declining. Leadership asks you to "fix it" and gives you a quarter.
>
> What's the first thing you actually do? (Pick one.)
>
> **A.** Spend the first 2 weeks actively participating in the community, talking to members, and mapping what's happening now.
> **B.** Set up analytics and tooling to measure engagement precisely — where it's happening, who's active, what triggers spikes — before doing anything else.
> **C.** Run a survey to ask members directly what they want and what's missing.
> **D.** Ship a clear experiment in week one — a new format, a new ritual, or a new event — and measure what happens.
>
> Then briefly (2–4 sentences): what's one metric you'd track, and why that one specifically?

**Answer mapping:**
```
A: 0   (qualitative immersion; reasonable but slow, not systems-first)
B: +1  (measurement-first; strong engineer discipline but may delay action)
C: -1  (asking users; classic but low-signal output in communities — people don't know what they want)
D: +2  (iterative experiment + measurement; engineer-mindset applied to a soft domain)

Short-response signal:
  Names a specific, non-vanity metric (e.g., "weekly active posters who return the following week" rather than "total members"): +2
  Explains why that metric reflects real engagement rather than surface activity: +1
  Names a vanity metric only (total members, total posts): -1
```

**Tooltips:**
- **"Engagement"**: members actively participating — posting, replying, attending events — not just being members.
- **"Vanity metric"**: a number that looks good but doesn't reflect real activity or value (e.g., "10,000 members" when only 50 are active).

---

## Section 7 — Tooltip Framework

### Rules for writing tooltips

**What tooltips SHOULD do:**
1. **Define domain-specific terms** — "SDR," "AE," "triage," "off-the-shelf"
2. **Clarify ambiguous scenarios** — what counts as "meaningful work," what counts as "critical code"
3. **Provide cultural or regional context** where terminology varies (e.g., "reconciliation" in finance, "pipeline" in sales)
4. **Unpack jargon** — if an item uses any industry term, a tooltip should define it plainly

**What tooltips MUST NOT do:**
1. Explain what construct the item is measuring
2. Hint at the "right" answer or preferred option
3. Reveal the scoring logic
4. Give examples that bias the response (e.g., "most candidates pick B" — never)
5. Add length to the item such that reading the tooltip takes longer than answering
6. Expose internal terminology ("engineer mindset," "learning orientation," etc.)

### Tooltip review checklist (apply to every tooltip before shipping)

- [ ] Does this tooltip only clarify meaning, not direction?
- [ ] Could a candidate read this tooltip and know what answer we want? If yes, rewrite.
- [ ] Is this tooltip shorter than 40 words? If not, trim.
- [ ] Does this tooltip avoid internal construct names?
- [ ] Is this tooltip in the same voice/register as the item itself?
- [ ] Would a non-native English speaker understand this better after reading it?

### UI design for tooltips

- Shown on hover (desktop) and tap (mobile)
- Hover-delay of ~500ms to avoid accidental triggering
- Candidate-facing analytics track tooltip usage per item — high tooltip usage is a signal the item wording may be unclear and should be revised
- Tooltips visually distinct but not attention-grabbing (small "?" icon next to flagged terms, not a large overlay)
- No tooltip on clearly-worded items; add them only where a term or scenario is potentially unclear

### Localization future-state
At v1 (English-only), tooltips are the primary mechanism for supporting non-native English speakers. When multi-language support arrives (v1.2+), tooltips should be translated with the same rigor as item prompts themselves, and any tooltip that uses US-specific business terminology should be re-verified for each market.

---

## Section 8 — Cross-bundle signals and reviewer output additions

### Additional dimension in reviewer output: Engineer Mindset + AI Fluency

For this company's instance of the product, the reviewer report should include an **additional dimension card** beyond the six core dimensions:

**Engineer Mindset + AI Fluency** (company-specific dimension)

Evidence sources:
- RF-S1 (engineer mindset SJT)
- RF-S2 (AI fluency SJT)
- RF-S3 (AI tool STAR — primary evidence)
- RF-S4 (engineer vs. domain tradeoff)
- Role-specific SJT (adds bundle-specific signal)

Report as a band estimate with the same 5 levels as other dimensions, or as `insufficient_signal` if fewer than 3 items contributed.

### Role-fit summary addition

At the top of the reviewer report, for bundles in this company, add a one-line **role-fit read**:

> **Marketing Engineer role-fit:** [Strong fit / Likely fit / Mixed fit / Weak fit / Likely mis-fit]

This read is computed from:
- The new Engineer Mindset + AI Fluency dimension
- RF-S4 (engineer vs. domain tradeoff) — a lean-Role-1 response is a meaningful negative
- Learning Orientation band from the core

**This read is displayed alongside an explicit caveat:** "Role-fit is a summary of observed signal against this company's specific hiring frame. It is not a hire/no-hire recommendation; an interview is required to make that call."

### What NOT to do
Do not produce a composite "Marketing Engineer Score" or a percentile against other Marketing Engineer candidates. That is the same anti-pattern as the "overall score" we rejected in the core spec. The role-fit read is a linguistic summary grounded in traceable dimensions, not a score.

---

## Section 9 — What's missing / next steps

1. **Seniority-band variants.** All bundles above default to early-career/mid. Senior-band variants need different items (more judgment, more autonomy, more domain complexity). Draft when senior hiring starts.

2. **Real SJT answer keys from subject-matter experts.** The answer mappings above are my judgment. Best practice for SJTs is to derive answer keys from consensus of 5–10 subject-matter experts (experienced marketing engineers, ops engineers, etc.) rating each option independently. Do this before production.

3. **The non-standard Sales Engineer title.** Consider renaming before external hiring to avoid confusion with traditional pre-sales SE roles.

4. **Cultural calibration for HK/Singapore candidates.** Several scenarios assume US-style business structure (SDRs, AEs, Slack/Discord-native communities). Review each bundle for regional applicability.

5. **Piloting.** Run at least one full candidate flow (core + Marketing Engineer bundle) on 10–20 internal or friendly-customer candidates before first real hire.

6. **Tooltip usage telemetry.** Build tooltip-hover tracking from day one. Items with >40% tooltip-hover rates are candidates for rewording.

---

*End of role-family bundles v1 draft.*
