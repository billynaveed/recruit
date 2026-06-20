/**
 * Deterministic band assignment rules for STAR item feature maps.
 *
 * Each item's rules are defined as a cascading set of conditions that produce a
 * band estimate plus the list of rule strings that fired. Rules are pure —
 * they do not touch the database or network.
 */

export type FeatureValues = Record<string, string>;
export type BandResult = { band: string; rulesFired: string[] };

export function assignBandCS1(features: FeatureValues): BandResult {
  const { specificity, outcome_clarity, first_person_agency, problem_ownership } = features;
  const rulesFired: string[] = [];

  if (
    specificity === "high" &&
    outcome_clarity === "concrete" &&
    ["high", "medium"].includes(first_person_agency) &&
    problem_ownership === "owned"
  ) {
    rulesFired.push(
      "strong_positive: specificity=high AND outcome_clarity=concrete AND first_person_agency>=medium AND problem_ownership=owned"
    );
    return { band: "strong_positive", rulesFired };
  }
  if (
    specificity === "high" &&
    ["concrete", "vague"].includes(outcome_clarity) &&
    ["high", "medium"].includes(first_person_agency)
  ) {
    rulesFired.push(
      "moderate_positive: specificity=high AND outcome_clarity>=vague AND first_person_agency>=medium"
    );
    return { band: "moderate_positive", rulesFired };
  }
  if (specificity === "medium" || outcome_clarity === "vague") {
    rulesFired.push("mixed: specificity=medium OR outcome_clarity=vague");
    return { band: "mixed", rulesFired };
  }
  rulesFired.push("limited_signal: default fallback");
  return { band: "limited_signal", rulesFired };
}

export function assignBandCS2(features: FeatureValues): BandResult {
  const { mistake_genuineness, ownership, disclosure_behavior, correction_action } = features;
  const rulesFired: string[] = [];

  if (mistake_genuineness === "avoided") {
    rulesFired.push("concern_flag: candidate declined to describe a real mistake");
    return { band: "concern_flag", rulesFired };
  }
  if (
    mistake_genuineness === "genuine" &&
    ownership === "owned" &&
    disclosure_behavior === "proactive" &&
    correction_action === "substantive"
  ) {
    rulesFired.push("strong_positive: genuine AND owned AND proactive AND substantive");
    return { band: "strong_positive", rulesFired };
  }
  if (
    mistake_genuineness === "genuine" &&
    ["owned", "partial"].includes(ownership) &&
    ["substantive", "nominal"].includes(correction_action)
  ) {
    rulesFired.push("moderate_positive: genuine AND (owned|partial) AND (substantive|nominal)");
    return { band: "moderate_positive", rulesFired };
  }
  if (mistake_genuineness === "minor_or_reshaped" || ownership === "externalized") {
    rulesFired.push("mixed: minor_or_reshaped OR externalized");
    return { band: "mixed", rulesFired };
  }
  rulesFired.push("limited_signal: default fallback");
  return { band: "limited_signal", rulesFired };
}

export function assignBandCS3(features: FeatureValues): BandResult {
  const { specificity_of_original_view, specificity_of_counterargument, nature_of_shift } = features;
  const rulesFired: string[] = [];

  if (
    specificity_of_original_view === "high" &&
    specificity_of_counterargument === "high" &&
    nature_of_shift === "substantive"
  ) {
    rulesFired.push("strong_positive: F1=high AND F2=high AND F3=substantive");
    return { band: "strong_positive", rulesFired };
  }
  if (
    ["high", "medium"].includes(specificity_of_original_view) &&
    ["high", "medium"].includes(specificity_of_counterargument) &&
    ["substantive", "tactical"].includes(nature_of_shift)
  ) {
    rulesFired.push("moderate_positive: F1>=medium AND F2>=medium AND F3 in [substantive, tactical]");
    return { band: "moderate_positive", rulesFired };
  }
  if (nature_of_shift === "performative") {
    rulesFired.push("mixed: nature_of_shift=performative");
    return { band: "mixed", rulesFired };
  }
  if (specificity_of_original_view === "low" || specificity_of_counterargument === "low") {
    rulesFired.push("limited_signal: F1=low OR F2=low");
    return { band: "limited_signal", rulesFired };
  }
  rulesFired.push("limited_signal: default fallback");
  return { band: "limited_signal", rulesFired };
}

export type CS4Result = {
  interpersonalProfile: Record<string, string>;
  composureContribution: string;
  rulesFired: string[];
};

export function assignBandCS4(features: FeatureValues): CS4Result {
  const { feedback_delivered, preparation, directness, follow_through, tone_about_other_person } = features;
  const rulesFired: string[] = [];

  let composureContribution = "neutral";
  if (feedback_delivered === "delivered" && tone_about_other_person === "respectful") {
    composureContribution = "positive_contribution";
    rulesFired.push("composure: delivered AND respectful");
  } else if (["dismissive", "defensive_about_self"].includes(tone_about_other_person)) {
    composureContribution = "concern_flag";
    rulesFired.push("composure concern: dismissive or defensive_about_self");
  }

  return {
    interpersonalProfile: {
      direct_vs_indirect: directness,
      conflict_approach: feedback_delivered,
      follow_through,
      regard_for_others: tone_about_other_person,
      preparation,
    },
    composureContribution,
    rulesFired,
  };
}

export function assignBandRFS3(features: FeatureValues): BandResult {
  const {
    specificity_of_work,
    depth_of_ai_workflow,
    limits_awareness,
    outcome_specificity,
    ownership_and_agency,
  } = features;
  const rulesFired: string[] = [];

  if (specificity_of_work === "low" || outcome_specificity === "missing") {
    rulesFired.push("limited_signal: F1=low OR F4=missing");
    return { band: "limited_signal", rulesFired };
  }
  if (depth_of_ai_workflow === "surface" || limits_awareness === "absent") {
    rulesFired.push("mixed: F2=surface OR F3=absent");
    return { band: "mixed", rulesFired };
  }
  if (
    specificity_of_work === "high" &&
    depth_of_ai_workflow === "sophisticated" &&
    limits_awareness === "explicit" &&
    outcome_specificity === "concrete"
  ) {
    rulesFired.push("strong_positive: all key features at highest value");
    return { band: "strong_positive", rulesFired };
  }
  if (
    specificity_of_work === "high" &&
    ["sophisticated", "basic"].includes(depth_of_ai_workflow) &&
    ["explicit", "implicit"].includes(limits_awareness) &&
    ["concrete", "vague"].includes(outcome_specificity)
  ) {
    rulesFired.push(
      "moderate_positive: F1=high AND F2>=basic AND F3>=implicit AND F4>=vague"
    );
    return { band: "moderate_positive", rulesFired };
  }
  if (ownership_and_agency === "low") {
    rulesFired.push(
      "concern_flag: F5=low — candidate may be dependent on AI rather than directing it"
    );
    return { band: "concern_flag", rulesFired };
  }
  rulesFired.push("limited_signal: default fallback");
  return { band: "limited_signal", rulesFired };
}

/**
 * Map an item ID to its band assignment. For C-S4 (interpersonal profile) the
 * composure contribution is collapsed into a band code for uniform storage.
 */
export function assignBand(itemId: string, features: FeatureValues): BandResult {
  switch (itemId) {
    case "C-S1":
      return assignBandCS1(features);
    case "C-S2":
      return assignBandCS2(features);
    case "C-S3":
      return assignBandCS3(features);
    case "C-S4": {
      const result = assignBandCS4(features);
      const band = result.composureContribution === "concern_flag" ? "concern_flag" : "profile";
      return { band, rulesFired: result.rulesFired };
    }
    case "RF-S3":
      return assignBandRFS3(features);
    default:
      return { band: "insufficient_signal", rulesFired: ["unknown item"] };
  }
}
