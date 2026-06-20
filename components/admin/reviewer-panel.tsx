import { ReviewStatus, ReviewRecommendation } from "@prisma/client";
import {
  assignReviewerAction,
  submitReviewAction,
  withdrawReviewAction,
} from "@/actions/reviews";
import { Button } from "@/components/ui/button";
import { summarizeConsensus } from "@/lib/reviews";

type ReviewRow = {
  id: string;
  reviewerEmail: string;
  assignedByEmail: string;
  status: ReviewStatus;
  recommendation: ReviewRecommendation | null;
  notes: string | null;
  assignedAt: Date;
  submittedAt: Date | null;
  withdrawnAt: Date | null;
};

type Props = {
  candidateId: string;
  currentUserEmail: string;
  reviews: ReviewRow[];
  allowedReviewers: string[];
};

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

const STATUS_BADGE: Record<ReviewStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  SUBMITTED: "bg-emerald-100 text-emerald-800",
  WITHDRAWN: "bg-slate-100 text-slate-500",
};

const STATUS_LABEL: Record<ReviewStatus, string> = {
  PENDING: "Pending",
  SUBMITTED: "Submitted",
  WITHDRAWN: "Withdrawn",
};

const fmt = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

export function ReviewerPanel({
  candidateId,
  currentUserEmail,
  reviews,
  allowedReviewers,
}: Props) {
  const me = currentUserEmail.toLowerCase();
  const activeReviews = reviews.filter((r) => r.status !== ReviewStatus.WITHDRAWN);
  const withdrawn = reviews.filter((r) => r.status === ReviewStatus.WITHDRAWN);
  const consensus = summarizeConsensus(activeReviews);

  const activeReviewerEmails = new Set(
    activeReviews.map((r) => r.reviewerEmail.toLowerCase())
  );
  const assignableReviewers = allowedReviewers.filter(
    (email) => !activeReviewerEmails.has(email)
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Reviewers
        </span>
        <span className="text-[11px] text-slate-400">
          {activeReviews.length}{" "}
          {activeReviews.length === 1 ? "assignment" : "assignments"}
        </span>
      </div>

      {consensus.total >= 2 && consensus.headline && (
        <div
          className={`px-5 py-2.5 border-b border-slate-100 text-[12px] font-medium ${
            consensus.leaning === "positive"
              ? "bg-emerald-50 text-emerald-800"
              : consensus.leaning === "negative"
                ? "bg-rose-50 text-rose-800"
                : "bg-amber-50 text-amber-800"
          }`}
        >
          <span className="uppercase tracking-wider text-[10px] mr-2 opacity-75">Consensus</span>
          {consensus.headline}
          {consensus.leaning === "split" && (
            <span className="ml-2 text-[11px] opacity-75">(split)</span>
          )}
        </div>
      )}

      <div className="px-5 py-4 space-y-4">
        {activeReviews.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No reviewers assigned yet.</p>
        ) : (
          <ul className="space-y-3">
            {activeReviews.map((r) => (
              <ReviewerRow
                key={r.id}
                review={r}
                isMe={r.reviewerEmail.toLowerCase() === me}
                canWithdraw={
                  r.status === ReviewStatus.PENDING &&
                  (r.reviewerEmail.toLowerCase() === me ||
                    r.assignedByEmail.toLowerCase() === me)
                }
              />
            ))}
          </ul>
        )}

        {assignableReviewers.length > 0 && (
          <form
            action={assignReviewerAction}
            className="flex items-center gap-2 pt-3 border-t border-slate-100"
          >
            <input type="hidden" name="candidateId" value={candidateId} />
            <label className="text-xs text-slate-500" htmlFor="reviewerEmail">
              Assign to
            </label>
            <select
              id="reviewerEmail"
              name="reviewerEmail"
              defaultValue=""
              required
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Choose reviewer…
              </option>
              {assignableReviewers.map((email) => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm">
              Assign
            </Button>
          </form>
        )}

        {withdrawn.length > 0 && (
          <details className="pt-3 border-t border-slate-100">
            <summary className="text-xs text-slate-400 cursor-pointer select-none hover:text-slate-600">
              {withdrawn.length} withdrawn
            </summary>
            <ul className="mt-2 space-y-1 text-xs text-slate-400">
              {withdrawn.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2">
                  <span>{r.reviewerEmail}</span>
                  <span>{r.withdrawnAt ? fmt.format(r.withdrawnAt) : "—"}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}

function ReviewerRow({
  review,
  isMe,
  canWithdraw,
}: {
  review: ReviewRow;
  isMe: boolean;
  canWithdraw: boolean;
}) {
  return (
    <li className="rounded-md border border-slate-100 bg-slate-50/50 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="min-w-0 flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800 truncate">
            {review.reviewerEmail}
            {isMe && (
              <span className="ml-1.5 text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                you
              </span>
            )}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[review.status]}`}
          >
            {STATUS_LABEL[review.status]}
          </span>
          {review.recommendation && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${RECOMMENDATION_BADGE[review.recommendation]}`}
            >
              {RECOMMENDATION_LABEL[review.recommendation]}
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400 shrink-0">
          {review.submittedAt
            ? `Submitted ${fmt.format(review.submittedAt)}`
            : `Assigned ${fmt.format(review.assignedAt)}`}
        </span>
      </div>

      {review.notes && (
        <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
          {review.notes}
        </p>
      )}

      {isMe && review.status === ReviewStatus.PENDING && (
        <DecisionForm reviewId={review.id} />
      )}

      {canWithdraw && (
        <form action={withdrawReviewAction} className="mt-2">
          <input type="hidden" name="reviewId" value={review.id} />
          <button
            type="submit"
            className="text-[11px] text-slate-400 hover:text-rose-600 underline decoration-dotted"
          >
            Withdraw assignment
          </button>
        </form>
      )}
    </li>
  );
}

function DecisionForm({ reviewId }: { reviewId: string }) {
  const options: Array<{ value: ReviewRecommendation; label: string }> = [
    { value: "STRONG_YES", label: "Strong yes" },
    { value: "YES", label: "Yes" },
    { value: "LEAN_NO", label: "Lean no" },
    { value: "NO", label: "No" },
  ];

  return (
    <form action={submitReviewAction} className="mt-3 space-y-2">
      <input type="hidden" name="reviewId" value={reviewId} />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-800"
          >
            <input
              type="radio"
              name="recommendation"
              value={o.value}
              required
              className="accent-blue-600"
            />
            {o.label}
          </label>
        ))}
      </div>
      <textarea
        name="notes"
        rows={3}
        placeholder="Notes (optional). What stood out, concerns, follow-up questions"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Button type="submit" size="sm">
        Submit decision
      </Button>
    </form>
  );
}
