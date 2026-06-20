import { CandidateStage } from "@prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_INVITE_DAYS = 7;
const ABANDONED_DAYS = 14;

export type EngagementBand = "strong" | "engaged" | "stale" | "abandoned" | "none";

export interface EngagementInput {
  stage: CandidateStage;
  completionPercent: number;
  sessionCount: number;
  totalTimeSeconds: number;
  lastActiveAt: Date | null;
  now: number; // ms timestamp; pass in for SSR purity
}

export interface EngagementResult {
  score: number; // 0–100
  band: EngagementBand;
}

/**
 * A coarse 0–100 engagement score plus a categorical band. Designed to be
 * directionally useful at a glance, not statistically calibrated. Intended
 * use: a sortable dashboard column and a recruiter's first-pass triage.
 *
 * Components:
 * - Completion progress (heavy weight): 0–60 points
 * - Time investment (moderate): up to 25 points, soft-capped at 30 active min
 * - Return visits (light): up to 10 points, capped at 4+ sessions
 * - Recency (light): up to 5 points, decays over 14 days of inactivity
 *
 * Bands derive from score AND the recency signal so that "abandoned" candidates
 * are flagged regardless of how completed they were before they went silent.
 */
export function computeEngagement(input: EngagementInput): EngagementResult {
  if (input.sessionCount === 0 && input.completionPercent === 0) {
    return { score: 0, band: "none" };
  }

  const completedTerminalStages: CandidateStage[] = [
    CandidateStage.COMPLETED,
    CandidateStage.SHORTLISTED,
    CandidateStage.OFFER,
    CandidateStage.HIRED,
    CandidateStage.REJECTED,
  ];
  const isFinishedFlow = completedTerminalStages.includes(input.stage);

  const completionPoints = isFinishedFlow
    ? 60
    : Math.min(60, Math.round(input.completionPercent * 0.6));

  const minutes = input.totalTimeSeconds / 60;
  const timePoints = Math.min(25, Math.round((Math.min(minutes, 30) / 30) * 25));

  const sessionPoints = Math.min(10, input.sessionCount * 3);

  let recencyPoints = 0;
  let daysSinceActive = Number.POSITIVE_INFINITY;
  if (input.lastActiveAt) {
    daysSinceActive = (input.now - input.lastActiveAt.getTime()) / DAY_MS;
    if (daysSinceActive <= 1) recencyPoints = 5;
    else if (daysSinceActive <= 3) recencyPoints = 4;
    else if (daysSinceActive <= 7) recencyPoints = 2;
    else recencyPoints = 0;
  }

  const score = Math.min(100, completionPoints + timePoints + sessionPoints + recencyPoints);

  let band: EngagementBand;
  if (isFinishedFlow) {
    band = "strong";
  } else if (daysSinceActive >= ABANDONED_DAYS) {
    band = "abandoned";
  } else if (daysSinceActive >= STALE_INVITE_DAYS) {
    band = "stale";
  } else if (score >= 60) {
    band = "engaged";
  } else if (score >= 30) {
    band = "engaged";
  } else if (input.sessionCount > 0) {
    band = "engaged";
  } else {
    band = "none";
  }

  return { score, band };
}

export const ENGAGEMENT_BAND_LABEL: Record<EngagementBand, string> = {
  strong: "Strong",
  engaged: "Engaged",
  stale: "Stale",
  abandoned: "Abandoned",
  none: "—",
};

export const ENGAGEMENT_BAND_CLASS: Record<EngagementBand, string> = {
  strong: "bg-emerald-100 text-emerald-800",
  engaged: "bg-sky-100 text-sky-800",
  stale: "bg-amber-100 text-amber-800",
  abandoned: "bg-rose-100 text-rose-700",
  none: "bg-slate-100 text-slate-500",
};

// ─── Stale invites ──────────────────────────────────────────────────────────

export interface InviteStaleness {
  isStale: boolean;
  daysSinceCreated: number;
}

export function computeInviteStaleness(args: {
  createdAt: Date;
  hasCandidate: boolean;
  isActive: boolean;
  now: number;
}): InviteStaleness {
  const daysSinceCreated = (args.now - args.createdAt.getTime()) / DAY_MS;
  const isStale =
    args.isActive && !args.hasCandidate && daysSinceCreated >= STALE_INVITE_DAYS;
  return { isStale, daysSinceCreated };
}

// ─── Time-to-finish ─────────────────────────────────────────────────────────

export interface TimeToFinishInput {
  firstOpenedAt: Date | null;
  submittedAt: Date | null;
  totalActiveSeconds: number;
}

export interface TimeToFinishResult {
  spanMs: number | null; // wall-clock from first activity to submit
  activeSeconds: number; // sum of session durations
  spanLabel: string | null; // "2 days" or "47m" formatted span
  activeLabel: string; // formatted active time
}

export function computeTimeToFinish(input: TimeToFinishInput): TimeToFinishResult {
  const activeLabel = formatDurationLong(input.totalActiveSeconds);

  if (!input.firstOpenedAt || !input.submittedAt) {
    return {
      spanMs: null,
      activeSeconds: input.totalActiveSeconds,
      spanLabel: null,
      activeLabel,
    };
  }
  const spanMs = input.submittedAt.getTime() - input.firstOpenedAt.getTime();
  return {
    spanMs,
    activeSeconds: input.totalActiveSeconds,
    spanLabel: formatSpanLong(spanMs),
    activeLabel,
  };
}

function formatDurationLong(seconds: number): string {
  if (seconds <= 0) return "0m";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours < 24) return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

function formatSpanLong(ms: number): string {
  if (ms <= 0) return "—";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours < 24) return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

export { formatDurationLong, formatSpanLong };
