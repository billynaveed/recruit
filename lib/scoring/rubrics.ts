/**
 * STAR behavioral item rubric definitions.
 *
 * Each rubric defines:
 *  - the set of features a scorer LLM must extract from a candidate's response
 *  - the allowed categorical values for each feature
 *  - a minimum response length below which scoring is skipped as `insufficient`
 *
 * These definitions are consumed by `star-scorer.ts` at prompt-build time and by
 * `band-rules.ts` when mapping extracted features to a band estimate.
 */

export type FeatureDef = {
  name: string;
  allowedValues: string[];
  extractionPrompt: string;
};

export type ItemRubric = {
  itemId: string;
  rubricVersion: string;
  minLength: number;
  features: FeatureDef[];
};

export const RUBRICS: Record<string, ItemRubric> = {
  "C-S1": {
    itemId: "C-S1",
    rubricVersion: "v1",
    minLength: 150,
    features: [
      {
        name: "specificity",
        allowedValues: ["high", "medium", "low"],
        extractionPrompt: `Rate the specificity of this response on a 3-point scale.
HIGH: names a specific project/task, timeframe, people, and/or concrete artifacts or metrics.
MEDIUM: includes some concrete details but remains partially abstract.
LOW: largely abstract or generic, without specific anchors.
Return exactly one word: high, medium, or low.`,
      },
      {
        name: "first_person_agency",
        allowedValues: ["high", "medium", "low"],
        extractionPrompt: `Evaluate how much first-person agency this response conveys.
HIGH: candidate clearly describes specific actions they personally took.
MEDIUM: some personal actions, mixed with team-level description.
LOW: primarily describes what the team or organization did; candidate's specific role unclear.
Return exactly one word: high, medium, or low.`,
      },
      {
        name: "problem_ownership",
        allowedValues: ["owned", "shared", "passive"],
        extractionPrompt: `When things went off-track, did the candidate drive the resolution?
OWNED: candidate actively drove the resolution.
SHARED: candidate participated in a team resolution.
PASSIVE: problem was addressed by others or circumstances; candidate describes being affected by the resolution rather than causing it.
Return exactly one word: owned, shared, or passive.`,
      },
      {
        name: "outcome_clarity",
        allowedValues: ["concrete", "vague", "missing"],
        extractionPrompt: `Is there a clear, specific outcome described?
CONCRETE: specific result with detail (what shipped, what changed, what the measurable effect was).
VAGUE: outcome referenced but without specifics.
MISSING: no clear outcome described.
Return exactly one word: concrete, vague, or missing.`,
      },
      {
        name: "attribution_pattern",
        allowedValues: ["internal", "mixed", "external"],
        extractionPrompt: `How does the candidate attribute the cause of the problem?
INTERNAL: attributes significant contributing factors to own decisions or actions.
MIXED: balanced attribution between self and external factors.
EXTERNAL: attributes cause primarily to others or circumstances.
Return exactly one word: internal, mixed, or external.`,
      },
    ],
  },
  "C-S2": {
    itemId: "C-S2",
    rubricVersion: "v1",
    minLength: 150,
    features: [
      {
        name: "mistake_genuineness",
        allowedValues: ["genuine", "minor_or_reshaped", "avoided"],
        extractionPrompt: `Evaluate whether the response describes a genuine, substantive mistake.
GENUINE: a real, non-trivial error with clear negative consequences for others, owned by the candidate.
MINOR_OR_RESHAPED: a small mistake, or an event reframed as a mistake that doesn't really read as one (e.g., "I worked too hard").
AVOIDED: the response does not describe an actual mistake; redirects to a neutral or positive story.
Return exactly one word: genuine, minor_or_reshaped, or avoided.`,
      },
      {
        name: "ownership",
        allowedValues: ["owned", "partial", "externalized"],
        extractionPrompt: `How does the candidate attribute responsibility for the mistake?
OWNED: explicit, first-person ownership of the error without significant externalization.
PARTIAL: mixed ownership with meaningful externalization of blame.
EXTERNALIZED: primary blame placed on others, circumstances, or systems.
Return exactly one word: owned, partial, or externalized.`,
      },
      {
        name: "disclosure_behavior",
        allowedValues: ["proactive", "reactive", "concealed_or_unclear"],
        extractionPrompt: `Did the candidate proactively disclose the mistake to affected parties?
PROACTIVE: candidate raised the issue before it was discovered by others.
REACTIVE: candidate acknowledged when asked or when it surfaced.
CONCEALED_OR_UNCLEAR: candidate did not disclose, or disclosure behavior is unclear from the response.
Return exactly one word: proactive, reactive, or concealed_or_unclear.`,
      },
      {
        name: "correction_action",
        allowedValues: ["substantive", "nominal", "absent"],
        extractionPrompt: `What did the candidate do to address the mistake?
SUBSTANTIVE: specific actions to fix, mitigate harm, or prevent recurrence.
NOMINAL: acknowledgment or apology without meaningful corrective action described.
ABSENT: no correction described.
Return exactly one word: substantive, nominal, or absent.`,
      },
      {
        name: "reflection_quality",
        allowedValues: ["genuine", "generic", "absent"],
        extractionPrompt: `Does the candidate describe genuine learning or updated behavior?
GENUINE: specific shift in approach, belief, or behavior tied to the mistake.
GENERIC: generic lesson ("I learned to communicate more") without specific behavioral shift.
ABSENT: no reflection on what was learned.
Return exactly one word: genuine, generic, or absent.`,
      },
    ],
  },
  "C-S3": {
    itemId: "C-S3",
    rubricVersion: "v1",
    minLength: 120,
    features: [
      {
        name: "specificity_of_original_view",
        allowedValues: ["high", "medium", "low"],
        extractionPrompt: `Rate how specifically the original view is described.
HIGH: original belief is described with specifics (what the candidate thought and why).
MEDIUM: belief referenced but abstract.
LOW: original belief not meaningfully described.
Return exactly one word: high, medium, or low.`,
      },
      {
        name: "specificity_of_counterargument",
        allowedValues: ["high", "medium", "low"],
        extractionPrompt: `Rate how specifically the counterargument is described.
HIGH: what the other person said is described with specifics.
MEDIUM: referenced abstractly.
LOW: not meaningfully described.
Return exactly one word: high, medium, or low.`,
      },
      {
        name: "nature_of_shift",
        allowedValues: ["substantive", "tactical", "performative"],
        extractionPrompt: `Evaluate the nature of the candidate's mind change.
SUBSTANTIVE: genuine change in belief or model, not just behavior.
TACTICAL: change in approach but not underlying belief.
PERFORMATIVE: response describes having "learned something" without evidence of real update.
Return exactly one word: substantive, tactical, or performative.`,
      },
      {
        name: "interpersonal_handling",
        allowedValues: ["constructive", "neutral", "defensive_initial"],
        extractionPrompt: `How did the candidate handle the interpersonal aspect of the pushback?
CONSTRUCTIVE: candidate describes engaging with the pushback without defensiveness.
NEUTRAL: handling not clearly described.
DEFENSIVE_INITIAL: candidate describes initial defensiveness followed by update (this is normal and honest; should not be penalized).
Return exactly one word: constructive, neutral, or defensive_initial.`,
      },
    ],
  },
  "C-S4": {
    itemId: "C-S4",
    rubricVersion: "v1",
    minLength: 150,
    features: [
      {
        name: "feedback_delivered",
        allowedValues: ["delivered", "softened", "avoided"],
        extractionPrompt: `Was the difficult feedback actually delivered?
DELIVERED: candidate clearly delivered the difficult message.
SOFTENED: candidate describes delivering a diluted version of the message.
AVOIDED: candidate ultimately did not deliver the feedback.
Return exactly one word: delivered, softened, or avoided.`,
      },
      {
        name: "preparation",
        allowedValues: ["deliberate", "minimal", "unclear"],
        extractionPrompt: `How prepared was the candidate?
DELIBERATE: candidate describes specific preparation (thinking through framing, picking time/place).
MINIMAL: feedback given without described preparation.
UNCLEAR: preparation not described.
Return exactly one word: deliberate, minimal, or unclear.`,
      },
      {
        name: "directness",
        allowedValues: ["direct", "hedged", "unclear"],
        extractionPrompt: `Was the language described direct?
DIRECT: candidate describes specific, direct language used.
HEDGED: describes indirect or heavily hedged language.
UNCLEAR: directness of language not described.
Return exactly one word: direct, hedged, or unclear.`,
      },
      {
        name: "follow_through",
        allowedValues: ["tracked", "absent"],
        extractionPrompt: `Did the candidate track or follow up on the feedback's impact?
TRACKED: candidate describes tracking or following up on the feedback's impact.
ABSENT: no follow-through described.
Return exactly one word: tracked, absent.`,
      },
      {
        name: "tone_about_other_person",
        allowedValues: ["respectful", "dismissive", "defensive_about_self"],
        extractionPrompt: `How does the candidate describe the recipient of the feedback?
RESPECTFUL: candidate describes the recipient without denigration.
DISMISSIVE: candidate describes the recipient in dismissive or contemptuous terms.
DEFENSIVE_ABOUT_SELF: candidate's framing is primarily defensive about their own reputation.
Return exactly one word: respectful, dismissive, or defensive_about_self.`,
      },
    ],
  },
  "RF-S3": {
    itemId: "RF-S3",
    rubricVersion: "v1",
    minLength: 200,
    features: [
      {
        name: "specificity_of_work",
        allowedValues: ["high", "medium", "low"],
        extractionPrompt: `Rate the specificity of the work described.
HIGH: specific project, specific tools named, concrete outputs described.
MEDIUM: some specifics but mixed with abstraction.
LOW: generic description of "using AI" without real project detail.
Return exactly one word: high, medium, or low.`,
      },
      {
        name: "depth_of_ai_workflow",
        allowedValues: ["sophisticated", "basic", "surface"],
        extractionPrompt: `Evaluate the depth of AI workflow described.
SOPHISTICATED: describes iteration, prompt structuring, chaining tools, building a workflow or pipeline, or integrating AI into a broader process.
BASIC: describes straightforward AI use (ask → receive → use) without iteration or structure.
SURFACE: describes AI use as one-off queries without workflow thinking.
Return exactly one word: sophisticated, basic, or surface.`,
      },
      {
        name: "limits_awareness",
        allowedValues: ["explicit", "implicit", "absent"],
        extractionPrompt: `Does the candidate describe AI limitations they encountered?
EXPLICIT: candidate describes specific AI failure modes they encountered and how they handled them.
IMPLICIT: candidate shows awareness of AI limits without specific failure examples.
ABSENT: candidate describes AI as uniformly useful with no acknowledgment of limits.
Return exactly one word: explicit, implicit, or absent.`,
      },
      {
        name: "outcome_specificity",
        allowedValues: ["concrete", "vague", "missing"],
        extractionPrompt: `Is a specific outcome described?
CONCRETE: specific output or result described.
VAGUE: outcome referenced without specifics.
MISSING: no outcome described.
Return exactly one word: concrete, vague, or missing.`,
      },
      {
        name: "ownership_and_agency",
        allowedValues: ["high", "medium", "low"],
        extractionPrompt: `Evaluate the candidate's agency in directing the AI work.
HIGH: candidate clearly drove the work; AI was a tool they directed.
MEDIUM: candidate participated with AI; mixed ownership.
LOW: candidate describes AI as having done the work, with their role unclear.
Return exactly one word: high, medium, or low.`,
      },
    ],
  },
};
