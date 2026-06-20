import Link from "next/link";
import { Users } from "lucide-react";
import { CandidateStage } from "@prisma/client";
import { ComparisonGrid } from "@/components/admin/comparison-grid";
import type { SynthesisResult } from "@/lib/scoring/synthesis";
import { type CandidateRowData, type RoleFitBand } from "./candidate-row";
import { CandidateTable } from "./candidate-table";

export type RawCandidate = {
  id: string;
  name: string;
  email: string;
  notes: string | null;
  stage: CandidateStage;
  completionPercent: number;
  lastActiveAt: Date | null;
  submission: { submittedAt: Date | null; synthesisJson: unknown | null } | null;
  reviews: Array<{ id: string }>;
};

export type CandidatesFilter =
  | "all"
  | "submitted"
  | "in_review"
  | "shortlisted"
  | "rejected"
  | "archived"
  | "compare";

export const CANDIDATES_FILTERS: readonly CandidatesFilter[] = [
  "all",
  "submitted",
  "in_review",
  "shortlisted",
  "rejected",
  "archived",
  "compare",
];

const FILTER_LABELS: Record<CandidatesFilter, string> = {
  all: "All",
  submitted: "Submitted",
  in_review: "In review",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  archived: "Archived",
  compare: "Compare",
};

const STAGE_GROUPS: Record<Exclude<CandidatesFilter, "all" | "compare">, CandidateStage[]> = {
  submitted: [CandidateStage.COMPLETED],
  in_review: [CandidateStage.REVIEWING],
  shortlisted: [
    CandidateStage.SHORTLISTED,
    CandidateStage.OFFER,
    CandidateStage.HIRED,
  ],
  rejected: [CandidateStage.REJECTED, CandidateStage.WITHDRAWN],
  archived: [CandidateStage.ARCHIVED],
};

const NON_ARCHIVED_FOR_ALL: CandidateStage[] = [
  CandidateStage.COMPLETED,
  CandidateStage.REVIEWING,
  CandidateStage.SHORTLISTED,
  CandidateStage.OFFER,
  CandidateStage.HIRED,
  CandidateStage.REJECTED,
  CandidateStage.WITHDRAWN,
];

export function CandidatesTab({
  jobId,
  filter,
  candidates,
  reviewerEmails,
}: {
  jobId: string;
  filter: CandidatesFilter;
  candidates: RawCandidate[];
  reviewerEmails: string[];
}) {
  const counts: Record<CandidatesFilter, number> = {
    all: candidates.filter((c) => NON_ARCHIVED_FOR_ALL.includes(c.stage)).length,
    submitted: candidates.filter((c) => STAGE_GROUPS.submitted.includes(c.stage)).length,
    in_review: candidates.filter((c) => STAGE_GROUPS.in_review.includes(c.stage)).length,
    shortlisted: candidates.filter((c) => STAGE_GROUPS.shortlisted.includes(c.stage)).length,
    rejected: candidates.filter((c) => STAGE_GROUPS.rejected.includes(c.stage)).length,
    archived: candidates.filter((c) => STAGE_GROUPS.archived.includes(c.stage)).length,
    compare: candidates.filter((c) => STAGE_GROUPS.submitted.includes(c.stage)).length,
  };

  const visible =
    filter === "all"
      ? candidates.filter((c) => NON_ARCHIVED_FOR_ALL.includes(c.stage))
      : filter === "compare"
      ? candidates.filter((c) => STAGE_GROUPS.submitted.includes(c.stage))
      : candidates.filter((c) => STAGE_GROUPS[filter].includes(c.stage));

  return (
    <div className="px-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 py-3">
        <span className="text-xs text-slate-500">Status</span>
        {CANDIDATES_FILTERS.map((f) => {
          const isActive = filter === f;
          const count = counts[f];
          return (
            <Link
              key={f}
              href={`/admin/jobs/${jobId}?tab=candidates&filter=${f}`}
              scroll={false}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {FILTER_LABELS[f]}
              {f !== "compare" && count > 0 && (
                <span
                  className={`text-[10px] ${
                    isActive ? "text-slate-300" : "text-slate-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {filter === "compare" ? (
        <ComparisonGrid
          candidates={visible.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            synthesis: (c.submission?.synthesisJson ?? null) as SynthesisResult | null,
          }))}
        />
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-sm text-slate-400">
          <Users className="h-5 w-5" />
          {emptyMessage(filter)}
        </div>
      ) : (
        <CandidateTable
          rows={visible.map(toRowData)}
          reviewerEmails={reviewerEmails}
          jobId={jobId}
        />
      )}
    </div>
  );
}

function toRowData(c: RawCandidate): CandidateRowData {
  const synthesis = c.submission?.synthesisJson as SynthesisResult | null;
  const roleFit = (synthesis?.roleFitRead?.band ?? null) as RoleFitBand | null;
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    stage: c.stage,
    submittedAt: c.submission?.submittedAt ?? null,
    roleFit,
    reviewerInitials: null,
    notes: c.notes,
  };
}

function emptyMessage(filter: CandidatesFilter): string {
  switch (filter) {
    case "submitted":
      return "Nothing waiting for review yet.";
    case "in_review":
      return "No candidates in review.";
    case "shortlisted":
      return "Nobody shortlisted yet.";
    case "rejected":
      return "No rejected candidates.";
    case "archived":
      return "No archived candidates.";
    default:
      return "No candidates yet.";
  }
}
