import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CandidateStage } from "@prisma/client";
import { getKnownAdminEmails } from "@/lib/session";
import { bulkApplyUrl } from "@/lib/base-url";
import { RoleHeader } from "./_components/role-header";
import { TabStrip, VALID_TABS, type JobTab } from "./_components/tab-strip";
import {
  CandidatesTab,
  CANDIDATES_FILTERS,
  type CandidatesFilter,
} from "./_components/candidates-tab";
import { InvitesTab, type BulkInviteLinkRow } from "./_components/invites-tab";
import { SetupTab } from "./_components/setup-tab";

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ tab?: string; filter?: string }>;
}) {
  const { jobId } = await params;
  const sp = await searchParams;

  const tabParam = sp.tab as JobTab | undefined;
  const tab: JobTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "candidates";

  const filterParam = sp.filter as CandidatesFilter | undefined;
  const filter: CandidatesFilter =
    filterParam && CANDIDATES_FILTERS.includes(filterParam) ? filterParam : "submitted";

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      roleQuestions: { orderBy: { sortOrder: "asc" } },
      invites: {
        orderBy: { createdAt: "desc" },
        include: { candidate: { select: { id: true } } },
      },
      bulkInviteLinks: {
        orderBy: { createdAt: "desc" },
        include: {
          invites: {
            select: { candidate: { select: { id: true } } },
          },
        },
      },
      candidates: {
        select: {
          id: true,
          name: true,
          email: true,
          notes: true,
          stage: true,
          completionPercent: true,
          lastActiveAt: true,
          submission: { select: { submittedAt: true, synthesisJson: true } },
          reviews: { where: { status: "SUBMITTED" }, select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!job) notFound();

  // Last-opened per bulk link: latest link_clicked event from any candidate it spawned
  const bulkLinkCandidateIds = job.bulkInviteLinks.flatMap((l) =>
    l.invites.map((i) => i.candidate?.id).filter((v): v is string => !!v)
  );
  const linkClickEvents =
    bulkLinkCandidateIds.length > 0
      ? await prisma.candidateEvent.findMany({
          where: {
            candidateId: { in: bulkLinkCandidateIds },
            eventType: "link_clicked",
          },
          orderBy: { occurredAt: "desc" },
          select: { candidateId: true, occurredAt: true },
        })
      : [];
  const lastOpenedByCandidate = new Map<string, Date>();
  for (const e of linkClickEvents) {
    if (!lastOpenedByCandidate.has(e.candidateId)) {
      lastOpenedByCandidate.set(e.candidateId, e.occurredAt);
    }
  }

  const bulkLinks: BulkInviteLinkRow[] = job.bulkInviteLinks.map((l) => {
    const candidateIdsForLink = l.invites.map((i) => i.candidate?.id).filter((v): v is string => !!v);
    let lastOpenedAt: Date | null = null;
    for (const cid of candidateIdsForLink) {
      const t = lastOpenedByCandidate.get(cid);
      if (t && (!lastOpenedAt || t > lastOpenedAt)) lastOpenedAt = t;
    }
    return {
      id: l.id,
      token: l.token,
      label: l.label,
      status: l.status,
      expiresAt: l.expiresAt,
      revokedAt: l.revokedAt,
      registrations: l.invites.length,
      lastOpenedAt,
    };
  });

  // Stats for the header
  const activeInvites = job.invites.filter((i) => i.status === "ACTIVE");
  const submittedCount = job.candidates.filter((c) =>
    ([CandidateStage.COMPLETED, CandidateStage.REVIEWING] as CandidateStage[]).includes(c.stage)
  ).length;
  const shortlistedCount = job.candidates.filter((c) =>
    ([CandidateStage.SHORTLISTED, CandidateStage.OFFER, CandidateStage.HIRED] as CandidateStage[]).includes(c.stage)
  ).length;
  const rejectedCount = job.candidates.filter((c) =>
    ([CandidateStage.REJECTED, CandidateStage.WITHDRAWN] as CandidateStage[]).includes(c.stage)
  ).length;
  const inProgressCount = job.candidates.filter((c) =>
    ([CandidateStage.IN_PROGRESS, CandidateStage.NOT_STARTED] as CandidateStage[]).includes(c.stage)
  ).length;
  const invitedCount = activeInvites.length + inProgressCount;

  const activeReusable = bulkLinks.find(
    // eslint-disable-next-line react-hooks/purity -- Server Component
    (l) => l.status === "ACTIVE" && l.expiresAt.getTime() > Date.now()
  );
  const reusableLinkUrl = activeReusable ? bulkApplyUrl(activeReusable.token) : null;

  // Tab sublines
  const needsReviewCount = job.candidates.filter((c) => c.stage === CandidateStage.COMPLETED).length;
  const candidatesSubline =
    needsReviewCount > 0
      ? `${needsReviewCount} to review`
      : `${job.candidates.length} candidate${job.candidates.length === 1 ? "" : "s"}`;
  const pendingInviteCount = activeInvites.length;
  const invitesSubline = `${activeReusable ? "reusable link · " : ""}${pendingInviteCount} pending`;
  const setupSubline = `description · ${job.roleQuestions.length} questions`;

  return (
    <div className="-mx-4 -my-4 sm:-mx-6 sm:-my-6">
      <div className="overflow-hidden border-y border-slate-200 bg-white sm:rounded-lg sm:border">
        <RoleHeader
          jobId={job.id}
          title={job.title}
          status={job.status}
          department={job.department}
          location={job.location}
          employmentType={job.employmentType}
          stats={{
            invited: invitedCount,
            submitted: submittedCount,
            shortlisted: shortlistedCount,
            rejected: rejectedCount,
          }}
          hasReusableLink={!!activeReusable}
          reusableLinkUrl={reusableLinkUrl}
        />

        <TabStrip
          jobId={job.id}
          active={tab}
          candidatesSubline={candidatesSubline}
          invitesSubline={invitesSubline}
          setupSubline={setupSubline}
        />

        {tab === "candidates" && (
          <CandidatesTab
            jobId={job.id}
            filter={filter}
            candidates={job.candidates}
            reviewerEmails={await getKnownAdminEmails()}
          />
        )}
        {tab === "invites" && (
          <InvitesTab
            jobId={job.id}
            invites={job.invites}
            bulkLinks={bulkLinks}
          />
        )}
        {tab === "setup" && (
          <SetupTab
            jobId={job.id}
            jobTitle={job.title}
            jobStatus={job.status}
            descriptionSource={job.descriptionSource}
            descriptionFileName={job.descriptionFileName}
            descriptionText={job.descriptionText}
            questions={job.roleQuestions.map((q) => ({
              prompt: q.prompt,
              wordLimit: q.wordLimit,
              source: q.source,
            }))}
          />
        )}
      </div>
    </div>
  );
}
