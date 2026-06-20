import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import Link from "next/link";

const STAGE_LABELS: Record<number, string> = {
  1: "Welcome",
  2: "Work history",
  3: "Role questions",
  4: "Standard questions",
  5: "Assessment",
  6: "Final reflection",
  7: "Submitted",
};

export default async function AnalyticsPage() {
  await requireAuth();

  const jobs = await prisma.job.findMany({
    where: { status: { in: [JobStatus.OPEN, JobStatus.CLOSED] } },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      candidates: {
        select: {
          id: true,
          currentStage: true,
          submission: { select: { submittedAt: true, createdAt: true } },
        },
      },
    },
  });

  // Pre-fetch first events to compute time-to-finish for each candidate
  const submittedCandidateIds = jobs.flatMap((j) =>
    j.candidates.filter((c) => c.submission?.submittedAt).map((c) => c.id)
  );
  const firstEvents =
    submittedCandidateIds.length > 0
      ? await prisma.candidateEvent.findMany({
          where: { candidateId: { in: submittedCandidateIds } },
          orderBy: { occurredAt: "asc" },
          distinct: ["candidateId"],
          select: { candidateId: true, occurredAt: true },
        })
      : [];
  const firstEventByCandidate = new Map(firstEvents.map((e) => [e.candidateId, e.occurredAt]));

  return (
    <div className="max-w-[960px] space-y-6 pb-12">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Analytics</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Where candidates drop off in the application flow, per role.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-sm text-slate-400 text-center">
          No open or closed jobs to analyse yet.
        </div>
      ) : (
        jobs.map((job) => {
          const candidates = job.candidates;
          const total = candidates.length;
          const submitted = candidates.filter((c) => c.submission?.submittedAt).length;

          // Funnel: how many reached at least stage N (1..7)
          const reachedAtLeast: number[] = [];
          for (let s = 1; s <= 7; s++) {
            const count = candidates.filter((c) => c.currentStage >= s).length;
            reachedAtLeast.push(count);
          }

          // Drop-off: candidates who got to stage N but never beyond
          const droppedAt: number[] = [];
          for (let s = 1; s <= 6; s++) {
            const dropped = candidates.filter((c) => c.currentStage === s).length;
            droppedAt.push(dropped);
          }

          // Median time-to-finish for submitted candidates
          const spans: number[] = candidates
            .filter((c) => c.submission?.submittedAt)
            .map((c) => {
              const first = firstEventByCandidate.get(c.id) ?? c.submission?.createdAt ?? null;
              if (!first || !c.submission?.submittedAt) return null;
              return c.submission.submittedAt.getTime() - first.getTime();
            })
            .filter((v): v is number => v !== null && v > 0);
          const medianSpan = median(spans);

          const submitRate = total > 0 ? Math.round((submitted / total) * 100) : 0;

          return (
            <section key={job.id} className="rounded-lg border border-slate-200 bg-white">
              <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/jobs/${job.id}`}
                    className="text-sm font-semibold text-slate-900 hover:underline"
                  >
                    {job.title}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {job.department || "General"}
                    {job.location ? ` · ${job.location}` : ""}
                    {" · "}
                    {total} {total === 1 ? "candidate" : "candidates"}
                    {" · "}
                    {submitRate}% submitted
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 shrink-0">
                  {job.status}
                </span>
              </div>

              {total === 0 ? (
                <div className="px-5 py-6 text-sm text-slate-400 text-center">
                  No candidates yet.
                </div>
              ) : (
                <div className="px-5 py-4 space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
                      Stage funnel
                    </p>
                    <ul className="space-y-1.5">
                      {[1, 2, 3, 4, 5, 6, 7].map((s) => {
                        const reached = reachedAtLeast[s - 1];
                        const pct = total > 0 ? Math.round((reached / total) * 100) : 0;
                        return (
                          <li key={s} className="flex items-center gap-3 text-sm">
                            <span className="w-32 shrink-0 text-slate-600">
                              {s}. {STAGE_LABELS[s]}
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full ${s === 7 ? "bg-emerald-500" : "bg-blue-500"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-20 shrink-0 text-right text-xs text-slate-500 tabular-nums">
                              {reached} ({pct}%)
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {droppedAt.some((n) => n > 0) && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
                        Drop-offs (reached stage and stopped)
                      </p>
                      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {droppedAt.map((count, i) => (
                          <li
                            key={i}
                            className={`rounded-md border px-2.5 py-1.5 ${
                              count > 0 ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-100 text-slate-400"
                            }`}
                          >
                            <span className="font-medium">Stage {i + 1}:</span>{" "}
                            {count > 0 ? `${count} stopped` : "—"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {medianSpan !== null && (
                    <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      Median time-to-finish for submitters: <strong>{formatSpan(medianSpan)}</strong>
                      {" · "}
                      based on {spans.length} {spans.length === 1 ? "candidate" : "candidates"}
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function formatSpan(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours < 24) return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}
