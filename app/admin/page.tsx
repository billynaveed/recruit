import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobStatus, CandidateStage, ReviewStatus } from "@prisma/client";
import { RoleGroup } from "@/components/admin/role-group";
import { Tip } from "@/components/admin/tip";
import { formatStage, stageBadgeClass, sortByStage } from "@/lib/candidates";
import { formatDurationShort } from "@/lib/events";
import { needsDecision } from "@/lib/reviews";
import {
  computeEngagement,
  computeInviteStaleness,
  ENGAGEMENT_BAND_CLASS,
  ENGAGEMENT_BAND_LABEL,
} from "@/lib/engagement";
import { shortlistCandidateAction, rejectCandidateAction } from "@/actions/candidates";
import Link from "next/link";

type DashboardTab = "all" | "open" | "draft" | "archived";
const VALID_TABS: readonly DashboardTab[] = ["all", "open", "draft", "archived"];

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await getSession();
  const sp = await searchParams;
  const filterParam = sp.filter as DashboardTab | undefined;
  const filter: DashboardTab =
    filterParam && VALID_TABS.includes(filterParam) ? filterParam : "all";

  const jobs = await prisma.job.findMany({
    orderBy: [{ updatedAt: "desc" }],
    include: {
      candidates: {
        select: {
          id: true,
          name: true,
          email: true,
          stage: true,
          status: true,
          completionPercent: true,
          reportStatus: true,
          lastActiveAt: true,
          reviews: {
            where: { status: ReviewStatus.SUBMITTED },
            select: { id: true },
          },
        },
      },
      invites: {
        where: { status: "ACTIVE" },
        select: { id: true, createdAt: true, candidate: { select: { id: true } } },
      },
    },
  });

  const allCandidateIds = jobs.flatMap((j) => j.candidates.map((c) => c.id));
  const sessionAggregates =
    allCandidateIds.length > 0
      ? await prisma.candidateSession.groupBy({
          by: ["candidateId"],
          where: { candidateId: { in: allCandidateIds } },
          _count: { _all: true },
          _sum: { durationSeconds: true },
        })
      : [];
  const sessionStatsByCandidate = new Map(
    sessionAggregates.map((row) => [
      row.candidateId,
      { sessionCount: row._count._all, totalSeconds: row._sum.durationSeconds ?? 0 },
    ])
  );

  const counts: Record<DashboardTab, number> = {
    all: jobs.filter((j) => j.status !== "ARCHIVED").length,
    open: jobs.filter((j) => j.status === "OPEN").length,
    draft: jobs.filter((j) => j.status === "DRAFT").length,
    archived: jobs.filter((j) => j.status === "ARCHIVED").length,
  };

  const filtered = jobs.filter((j) => {
    if (filter === "all") return j.status !== "ARCHIVED";
    if (filter === "open") return j.status === "OPEN";
    if (filter === "draft") return j.status === "DRAFT";
    if (filter === "archived") return j.status === "ARCHIVED";
    return true;
  });

  const allCandidates = filtered.flatMap((j) => j.candidates);
  const totalCandidates = allCandidates.length;
  const submittedCount = allCandidates.filter((c) => c.stage === CandidateStage.COMPLETED).length;
  const inProgressCount = allCandidates.filter((c) => c.stage === CandidateStage.IN_PROGRESS).length;
  const shortlistedCount = allCandidates.filter((c) => c.stage === CandidateStage.SHORTLISTED).length;
  const activeRoles = filtered.filter((j) => j.status === JobStatus.OPEN).length;

  // eslint-disable-next-line react-hooks/purity -- Server Component, runs once
  const now = Date.now();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Pipeline overview</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{session.email}</p>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link href="/admin/jobs/new">
            <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Create job</span>
          </Link>
        </Button>
      </div>

      <Tip id="dashboard-overview" title="New here?">
        Click a role title to open its detail page, or right-click a job in the sidebar to archive
        it. See the <a href="/admin/help" className="underline font-medium">How to use</a> page for
        the full walkthrough.
      </Tip>

      {/* Inline stat strip */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <Stat n={activeRoles} label="open roles" emphasis />
        <Stat n={totalCandidates} label="candidates" />
        <Stat n={submittedCount} label="submitted" />
        <Stat n={shortlistedCount} label="shortlisted" />
        <Stat n={inProgressCount} label="in progress" />
      </div>

      {/* Tab strip */}
      <nav className="flex gap-1 border-b border-slate-200">
        {(
          [
            ["all", "All", counts.all],
            ["open", "Open", counts.open],
            ["draft", "Drafts", counts.draft],
            ["archived", "Archived", counts.archived],
          ] as Array<[DashboardTab, string, number]>
        ).map(([key, label, n]) => {
          const isActive = filter === key;
          return (
            <Link
              key={key}
              href={key === "all" ? "/admin" : `/admin?filter=${key}`}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "-mb-px border-slate-900 font-medium text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
              {n > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {n}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Role list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-200 p-8 text-sm text-slate-500">
            <Briefcase className="h-5 w-5 text-slate-300" />
            {filter === "archived"
              ? "No archived roles."
              : filter === "draft"
              ? "No drafts. Create a role to get started."
              : "No roles yet. Create the first one above."}
          </div>
        ) : (
          filtered.map((job, index) => {
            const sorted = sortByStage(job.candidates);
            const stageSummary = buildStageSummary(job.candidates);
            const needsDecisionInJob = job.candidates.filter((c) =>
              needsDecision({ stage: c.stage, submittedReviewCount: c.reviews.length })
            ).length;
            const staleInvitesInJob = job.invites.filter((inv) =>
              computeInviteStaleness({
                createdAt: inv.createdAt,
                hasCandidate: !!inv.candidate,
                isActive: true,
                now,
              }).isStale
            ).length;
            return (
              <RoleGroup
                key={job.id}
                defaultOpen={index === 0 && filter !== "archived"}
                candidateCount={job.candidates.length}
                href={`/admin/jobs/${job.id}`}
                header={
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{job.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {job.department || "General"}
                        {job.location ? ` · ${job.location}` : ""}
                        {stageSummary ? ` · ${stageSummary}` : ""}
                      </p>
                    </div>
                    {needsDecisionInJob > 0 && (
                      <span
                        className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold shrink-0"
                        title="Candidates with submitted reviews awaiting your shortlist or reject"
                      >
                        {needsDecisionInJob} need decision
                      </span>
                    )}
                    {staleInvitesInJob > 0 && (
                      <span
                        className="rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-semibold shrink-0 border border-amber-200"
                        title="Invites with no candidate activity for 7+ days"
                      >
                        {staleInvitesInJob} stale {staleInvitesInJob === 1 ? "invite" : "invites"}
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 shrink-0">
                      {job.status}
                    </span>
                  </div>
                }
              >
                <div className="divide-y divide-slate-100">
                  {sorted.map((candidate) => {
                    const stats = sessionStatsByCandidate.get(candidate.id);
                    const engagement = computeEngagement({
                      stage: candidate.stage,
                      completionPercent: candidate.completionPercent,
                      sessionCount: stats?.sessionCount ?? 0,
                      totalTimeSeconds: stats?.totalSeconds ?? 0,
                      lastActiveAt: candidate.lastActiveAt,
                      now,
                    });
                    return (
                      <CandidateRow
                        key={candidate.id}
                        candidate={candidate}
                        now={now}
                        sessionStats={stats}
                        needsDecision={needsDecision({
                          stage: candidate.stage,
                          submittedReviewCount: candidate.reviews.length,
                        })}
                        engagement={engagement}
                      />
                    );
                  })}
                </div>
              </RoleGroup>
            );
          })
        )}
      </div>
    </div>
  );
}

function Stat({ n, label, emphasis }: { n: number; label: string; emphasis?: boolean }) {
  return (
    <span
      className={`inline-flex items-baseline gap-1.5 rounded-full px-2.5 py-1 text-xs ${
        emphasis
          ? "bg-yfs-accent/15 text-slate-900 ring-1 ring-yfs-accent/40"
          : "text-slate-600"
      }`}
    >
      <b className="text-sm font-semibold">{n}</b>
      <span className="text-slate-500">{label}</span>
    </span>
  );
}

function buildStageSummary(candidates: Array<{ stage: CandidateStage }>): string {
  if (candidates.length === 0) return "";
  const counts: Partial<Record<CandidateStage, number>> = {};
  for (const c of candidates) {
    counts[c.stage] = (counts[c.stage] ?? 0) + 1;
  }
  const parts: string[] = [];
  if (counts.COMPLETED) parts.push(`${counts.COMPLETED} completed`);
  if (counts.OFFER) parts.push(`${counts.OFFER} offer`);
  if (counts.REVIEWING) parts.push(`${counts.REVIEWING} reviewing`);
  if (counts.IN_PROGRESS) parts.push(`${counts.IN_PROGRESS} in progress`);
  if (counts.NOT_STARTED) parts.push(`${counts.NOT_STARTED} not started`);
  return parts.join(" · ");
}

const SHORTLISTABLE: CandidateStage[] = [CandidateStage.COMPLETED, CandidateStage.REVIEWING];
const REJECTABLE: CandidateStage[] = [
  CandidateStage.COMPLETED,
  CandidateStage.REVIEWING,
  CandidateStage.SHORTLISTED,
];

function CandidateRow({
  candidate,
  now,
  sessionStats,
  needsDecision: showNeedsDecision,
  engagement,
}: {
  candidate: {
    id: string;
    name: string;
    email: string;
    stage: CandidateStage;
    completionPercent: number;
    reportStatus: string | null;
    lastActiveAt: Date | null;
  };
  now: number;
  sessionStats?: { sessionCount: number; totalSeconds: number };
  needsDecision: boolean;
  engagement: { score: number; band: "strong" | "engaged" | "stale" | "abandoned" | "none" };
}) {
  const canShortlist = SHORTLISTABLE.includes(candidate.stage);
  const canReject = REJECTABLE.includes(candidate.stage);
  const showActions = canShortlist || canReject;

  return (
    <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 hover:bg-slate-50 transition-colors group">
      <Link
        href={`/admin/candidates/${candidate.id}`}
        className="min-w-0 flex-1"
      >
        <p className="text-sm font-medium text-slate-900 group-hover:text-slate-700 truncate">
          {candidate.name}
        </p>
        <p className="text-xs text-slate-500 truncate">{candidate.email}</p>
      </Link>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${stageBadgeClass(candidate.stage)}`}
        >
          {formatStage(candidate.stage)}
        </span>
        {showNeedsDecision && (
          <span
            className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px] font-semibold"
            title="Reviewer has submitted a decision — awaiting your shortlist or reject"
          >
            Needs decision
          </span>
        )}
        {engagement.band !== "none" && (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ENGAGEMENT_BAND_CLASS[engagement.band]}`}
            title={`Engagement score ${engagement.score}/100`}
          >
            {ENGAGEMENT_BAND_LABEL[engagement.band]}
          </span>
        )}
        {candidate.completionPercent > 0 && (
          <span className="text-xs text-slate-400 hidden sm:block">
            {candidate.completionPercent}%
          </span>
        )}
        {sessionStats && sessionStats.sessionCount > 0 && (
          <span className="text-xs text-slate-400 hidden md:block" title="Sessions · total time">
            {sessionStats.sessionCount}× · {formatDurationShort(sessionStats.totalSeconds)}
          </span>
        )}
        {candidate.lastActiveAt && (
          <span className="text-xs text-slate-400 hidden lg:block">
            {new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
              Math.round(
                (candidate.lastActiveAt.getTime() - now) / (1000 * 60 * 60 * 24)
              ),
              "day"
            )}
          </span>
        )}
      </div>

      {showActions && (
        <div className="flex items-center gap-1 shrink-0">
          {canShortlist && (
            <form action={shortlistCandidateAction}>
              <input type="hidden" name="candidateId" value={candidate.id} />
              <button
                type="submit"
                className="rounded px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                title="Shortlist"
              >
                Shortlist
              </button>
            </form>
          )}
          {canReject && (
            <form action={rejectCandidateAction}>
              <input type="hidden" name="candidateId" value={candidate.id} />
              <button
                type="submit"
                className="rounded px-2 py-1 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                title="Reject"
              >
                Reject
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
