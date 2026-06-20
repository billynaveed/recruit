import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobMenu } from "./job-menu";

export function RoleHeader({
  jobId,
  title,
  status,
  department,
  location,
  employmentType,
  stats,
  hasReusableLink,
  reusableLinkUrl,
}: {
  jobId: string;
  title: string;
  status: string;
  department: string | null;
  location: string | null;
  employmentType: string | null;
  stats: { invited: number; submitted: number; shortlisted: number; rejected: number };
  hasReusableLink: boolean;
  reusableLinkUrl: string | null;
}) {
  const subtitle = [department || "General", location, employmentType]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All jobs
        </Link>
        <div className="mt-1 flex items-baseline gap-2">
          <h1 className="text-xl font-semibold text-slate-900 truncate">{title}</h1>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {status}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500 truncate">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatChip jobId={jobId} filter="all" n={stats.invited} label="invited" />
        <StatChip jobId={jobId} filter="submitted" n={stats.submitted} label="submitted" emphasis />
        <StatChip jobId={jobId} filter="shortlisted" n={stats.shortlisted} label="shortlisted" />
        <StatChip jobId={jobId} filter="rejected" n={stats.rejected} label="rejected" />

        <div className="mx-1 h-6 w-px bg-slate-200" />

        <Button asChild size="sm">
          <Link href={`/admin/jobs/${jobId}?tab=invites#invite-hero`}>+ Invite</Link>
        </Button>
        <JobMenu
          jobId={jobId}
          jobTitle={title}
          hasReusableLink={hasReusableLink}
          reusableLinkUrl={reusableLinkUrl}
        />
      </div>
    </div>
  );
}

function StatChip({
  jobId,
  filter,
  n,
  label,
  emphasis,
}: {
  jobId: string;
  filter: string;
  n: number;
  label: string;
  emphasis?: boolean;
}) {
  return (
    <Link
      href={`/admin/jobs/${jobId}?tab=candidates&filter=${filter}`}
      className={`inline-flex items-baseline gap-1 rounded-full px-2.5 py-1 text-xs transition-colors hover:bg-slate-100 ${
        emphasis
          ? "bg-yfs-accent/15 text-slate-900 ring-1 ring-yfs-accent/40 hover:bg-yfs-accent/25"
          : "text-slate-600"
      }`}
    >
      <b className="text-sm font-semibold">{n}</b>
      <span className="text-slate-500">{label}</span>
    </Link>
  );
}
