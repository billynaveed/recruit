import { CandidateStage, CandidateStatus } from "@prisma/client";

export const STAGE_ORDER: Record<CandidateStage, number> = {
  COMPLETED: 0,
  SHORTLISTED: 1,
  OFFER: 2,
  REVIEWING: 3,
  IN_PROGRESS: 4,
  NOT_STARTED: 5,
  HIRED: 6,
  WITHDRAWN: 7,
  REJECTED: 8,
  ARCHIVED: 9,
};

export function sortByStage<T extends { stage: CandidateStage }>(candidates: T[]): T[] {
  return [...candidates].sort((a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage]);
}

export function formatStage(stage: CandidateStage): string {
  const labels: Record<CandidateStage, string> = {
    NOT_STARTED: "Not started",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    REVIEWING: "Reviewing",
    SHORTLISTED: "Shortlisted",
    OFFER: "Offer",
    HIRED: "Hired",
    REJECTED: "Rejected",
    WITHDRAWN: "Withdrawn",
    ARCHIVED: "Archived",
  };
  return labels[stage];
}

export function formatStatus(status: CandidateStatus): string {
  const labels: Record<CandidateStatus, string> = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    ARCHIVED: "Archived",
  };
  return labels[status];
}

export function stageBadgeClass(stage: CandidateStage): string {
  const classes: Record<CandidateStage, string> = {
    COMPLETED: "bg-emerald-100 text-emerald-700",
    REVIEWING: "bg-violet-100 text-violet-700",
    SHORTLISTED: "bg-blue-100 text-blue-700",
    OFFER: "bg-indigo-100 text-indigo-700",
    HIRED: "bg-emerald-600 text-white",
    IN_PROGRESS: "bg-amber-100 text-amber-700",
    NOT_STARTED: "bg-slate-100 text-slate-500",
    WITHDRAWN: "bg-slate-100 text-slate-400",
    REJECTED: "bg-red-100 text-red-600",
    ARCHIVED: "bg-slate-100 text-slate-500",
  };
  return classes[stage];
}
