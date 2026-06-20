import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ReviewStatus, ReviewRecommendation, CandidateStage } from "@prisma/client";
import { formatStage, stageBadgeClass } from "@/lib/candidates";
import { Tip } from "@/components/admin/tip";

const RECOMMENDATION_LABEL: Record<ReviewRecommendation, string> = {
  STRONG_YES: "Strong yes",
  YES: "Yes",
  LEAN_NO: "Lean no",
  NO: "No",
};

const RECOMMENDATION_BADGE: Record<ReviewRecommendation, string> = {
  STRONG_YES: "bg-emerald-100 text-emerald-800",
  YES: "bg-sky-100 text-sky-800",
  LEAN_NO: "bg-amber-100 text-amber-800",
  NO: "bg-rose-100 text-rose-800",
};

const fmt = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

export default async function ReviewsPage() {
  const session = await requireAuth();
  const me = session.email.toLowerCase();

  const [myPending, mySubmitted, teamPending] = await Promise.all([
    prisma.review.findMany({
      where: { reviewerEmail: me, status: ReviewStatus.PENDING },
      orderBy: { assignedAt: "asc" },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            stage: true,
            job: { select: { id: true, title: true } },
          },
        },
      },
    }),
    prisma.review.findMany({
      where: { reviewerEmail: me, status: ReviewStatus.SUBMITTED },
      orderBy: { submittedAt: "desc" },
      take: 25,
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            stage: true,
            job: { select: { id: true, title: true } },
          },
        },
      },
    }),
    prisma.review.findMany({
      where: {
        status: ReviewStatus.PENDING,
        reviewerEmail: { not: me },
      },
      orderBy: { assignedAt: "asc" },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            stage: true,
            job: { select: { id: true, title: true } },
          },
        },
      },
    }),
  ]);

  return (
    <div className="max-w-[960px] space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Reviews</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Candidate review assignments. Pending items need your decision.
        </p>
      </div>

      <Tip id="reviews-queue">
        Click any pending row to open the candidate. Read their assessment, then submit your decision from the
        <em> Reviewers </em> panel on that page. Submitted decisions are final — withdraw and reassign if you need to redo.
      </Tip>

      <Section
        title="Assigned to you — pending"
        emptyText="No reviews waiting on you."
        count={myPending.length}
        accent="amber"
      >
        {myPending.map((r) => (
          <ReviewLink
            key={r.id}
            href={`/admin/candidates/${r.candidate.id}`}
            primary={r.candidate.name}
            secondary={`${r.candidate.email} · ${r.candidate.job.title}`}
            stage={r.candidate.stage}
            recommendation={null}
            timestampLabel={`Assigned ${fmt.format(r.assignedAt)}`}
          />
        ))}
      </Section>

      <Section
        title="Assigned to you — submitted"
        emptyText="No submitted reviews yet."
        count={mySubmitted.length}
      >
        {mySubmitted.map((r) => (
          <ReviewLink
            key={r.id}
            href={`/admin/candidates/${r.candidate.id}`}
            primary={r.candidate.name}
            secondary={`${r.candidate.email} · ${r.candidate.job.title}`}
            stage={r.candidate.stage}
            recommendation={r.recommendation}
            timestampLabel={
              r.submittedAt ? `Submitted ${fmt.format(r.submittedAt)}` : ""
            }
          />
        ))}
      </Section>

      <Section
        title="Team queue — open assignments"
        emptyText="No outstanding reviews on the team."
        count={teamPending.length}
      >
        {teamPending.map((r) => (
          <ReviewLink
            key={r.id}
            href={`/admin/candidates/${r.candidate.id}`}
            primary={r.candidate.name}
            secondary={`${r.reviewerEmail} · ${r.candidate.job.title}`}
            stage={r.candidate.stage}
            recommendation={null}
            timestampLabel={`Assigned ${fmt.format(r.assignedAt)}`}
          />
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  emptyText,
  count,
  accent,
  children,
}: {
  title: string;
  emptyText: string;
  count: number;
  accent?: "amber";
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            accent === "amber" && count > 0
              ? "bg-amber-100 text-amber-800"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {count}
        </span>
      </div>
      {count === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-6 text-sm text-slate-400 text-center">
          {emptyText}
        </div>
      ) : (
        <ul className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
          {children}
        </ul>
      )}
    </section>
  );
}

function ReviewLink({
  href,
  primary,
  secondary,
  stage,
  recommendation,
  timestampLabel,
}: {
  href: string;
  primary: string;
  secondary: string;
  stage: CandidateStage;
  recommendation: ReviewRecommendation | null;
  timestampLabel: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900 truncate">{primary}</p>
          <p className="text-xs text-slate-500 truncate">{secondary}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${stageBadgeClass(stage)}`}
          >
            {formatStage(stage)}
          </span>
          {recommendation && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${RECOMMENDATION_BADGE[recommendation]}`}
            >
              {RECOMMENDATION_LABEL[recommendation]}
            </span>
          )}
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {timestampLabel}
          </span>
        </div>
      </Link>
    </li>
  );
}
