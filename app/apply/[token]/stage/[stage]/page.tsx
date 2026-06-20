import { notFound, redirect } from "next/navigation";
import { validateToken, getApplicationState } from "@/lib/apply";
import { logCandidateEvent } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { StageProgress } from "@/components/apply/stage-progress";
import { Stage1 } from "@/components/apply/stage-1";
import { Stage2 } from "@/components/apply/stage-2";
import { Stage3 } from "@/components/apply/stage-3";
import { Stage4 } from "@/components/apply/stage-4";
import { Stage5 } from "@/components/apply/stage-5";
import { Stage6 } from "@/components/apply/stage-6";

export default async function StagePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string; stage: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { token, stage: stageParam } = await params;
  const sp = await searchParams;
  const stageNum = parseInt(stageParam, 10);

  if (isNaN(stageNum) || stageNum < 1 || stageNum > 6) notFound();

  const tokenResult = await validateToken(token);
  if (!tokenResult.valid) redirect(`/apply/${token}/expired`);

  const state = await getApplicationState(token);
  if (!state) redirect(`/apply/${token}`);
  if (state.submission.submittedAt) redirect(`/apply/${token}/submitted`);

  // Don't let candidate skip ahead
  if (stageNum > state.candidate.currentStage) {
    redirect(`/apply/${token}/stage/${state.candidate.currentStage}`);
  }

  await logCandidateEvent(state.candidate.id, state.job.id, "stage_viewed", {
    stage: stageNum,
  });

  const sub = state.submission;

  const stageStatuses = [
    { label: "Welcome and consent", complete: sub.consentGiven },
    { label: "Background and CV", complete: !!sub.cvPath },
    { label: "Role-specific questions", complete: Object.keys(sub.roleAnswers as object ?? {}).length > 0 },
    { label: "Standard questions", complete: Object.keys(sub.standardAnswers as object ?? {}).length > 0 },
    { label: "Short assessment", complete: Object.keys(sub.psychoAnswers as object ?? {}).length > 0 },
    { label: "Final reflection", complete: !!sub.finalReflection },
  ];

  return (
    <div>
      <StageProgress currentStage={stageNum} />

      {stageNum === 1 && (
        <Stage1
          token={token}
          candidateName={state.candidate.name}
          jobTitle={state.job.title}
          consentGiven={sub.consentGiven}
        />
      )}

      {stageNum === 2 && (
        <Stage2
          token={token}
          candidateId={state.candidate.id}
          initialCvPath={sub.cvPath}
          initialCoverLetter={sub.coverLetter}
          initialProjects={(sub.projects as Array<{ title: string; url: string; description: string }>) ?? []}
          error={sp.error ?? null}
        />
      )}

      {stageNum === 3 && (
        <Stage3
          token={token}
          questions={state.job.roleQuestions}
          initialAnswers={(sub.roleAnswers as Record<string, string>) ?? {}}
        />
      )}

      {stageNum === 4 && (
        <Stage4
          token={token}
          questions={await prisma.standardQuestion.findMany({
            where: { active: true },
            orderBy: { sortOrder: "asc" },
          })}
          initialAnswers={(sub.standardAnswers as Record<string, string>) ?? {}}
        />
      )}

      {stageNum === 5 && (
        <Stage5
          token={token}
          items={await prisma.psychometricItem.findMany({
            where: { active: true },
            orderBy: { sortOrder: "asc" },
            select: { id: true, itemId: true, itemType: true, body: true, options: true, construct: true, minLength: true, sortOrder: true },
          })}
          initialAnswers={(sub.psychoAnswers as Record<string, string | string[]>) ?? {}}
        />
      )}

      {stageNum === 6 && (
        <Stage6
          token={token}
          initialReflection={sub.finalReflection}
          stageStatuses={stageStatuses}
        />
      )}
    </div>
  );
}
