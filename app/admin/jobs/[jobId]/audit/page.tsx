import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FILTER_GROUPS: Record<string, { label: string; actions: string[] }> = {
  all: { label: "All", actions: [] },
  invites: {
    label: "Invites",
    actions: [
      "INVITE_CREATED",
      "INVITE_LINK_COPIED",
      "INVITE_REVOKED",
      "INVITE_EXPIRY_EXTENDED",
      "INVITE_TOKEN_REGENERATED",
      "INVITE_DELETED",
      "INVITES_IMPORTED",
      "BULK_INVITE_LINK_CREATED",
      "BULK_INVITE_LINK_REVOKED",
      "BULK_INVITE_REGISTRATION",
    ],
  },
  candidates: {
    label: "Candidates",
    actions: [
      "CANDIDATE_SHORTLISTED",
      "CANDIDATE_REJECTED",
      "CANDIDATE_RESTORED_TO_SHORTLIST",
      "CANDIDATE_HIRED",
      "CANDIDATE_MOVED_TO_REVIEWING",
      "CANDIDATE_ARCHIVED",
      "CANDIDATE_UNARCHIVED",
      "CANDIDATE_NOTES_UPDATED",
      "CANDIDATE_DATA_ERASED",
    ],
  },
  reviews: {
    label: "Reviews",
    actions: ["REVIEW_ASSIGNED", "REVIEW_SUBMITTED", "REVIEW_WITHDRAWN"],
  },
  job: {
    label: "Role config",
    actions: [
      "JOB_CREATED",
      "JOB_STATUS_CHANGED",
      "JOB_DESCRIPTION_UPDATED",
      "JOB_ROLE_QUESTIONS_UPDATED",
      "JOB_DELETED",
    ],
  },
};

export default async function JobAuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { jobId } = await params;
  const { filter } = await searchParams;
  const activeFilter = filter && filter in FILTER_GROUPS ? filter : "all";
  const allowedActions = FILTER_GROUPS[activeFilter].actions;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      auditLogs: {
        where:
          activeFilter === "all"
            ? undefined
            : { action: { in: allowedActions } },
        orderBy: { createdAt: "desc" },
        take: 200,
      },
    },
  });

  if (!job) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/admin/jobs/${job.id}`}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {job.title}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            Audit log
          </CardTitle>
          <CardDescription>
            All admin actions on this role. Most recent first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {Object.entries(FILTER_GROUPS).map(([key, group]) => {
              const isActive = activeFilter === key;
              return (
                <Link
                  key={key}
                  href={`/admin/jobs/${job.id}/audit${key === "all" ? "" : `?filter=${key}`}`}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {group.label}
                </Link>
              );
            })}
          </div>

          {job.auditLogs.length === 0 ? (
            <p className="text-sm text-slate-400">No entries.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {job.auditLogs.map((log) => (
                <li
                  key={log.id}
                  className="grid grid-cols-[1fr_auto] items-baseline gap-4 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{log.action}</p>
                    <p className="truncate text-xs text-slate-500">{log.actorEmail}</p>
                  </div>
                  <p className="shrink-0 text-xs text-slate-400">
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(log.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
