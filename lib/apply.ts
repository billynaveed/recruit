import { prisma } from "@/lib/prisma";
import { CandidateStage } from "@prisma/client";
import { logCandidateEvent } from "@/lib/events";

export type ApplicationState = {
  candidate: {
    id: string;
    name: string;
    email: string;
    currentStage: number;
    completionPercent: number;
    stage: CandidateStage;
  };
  submission: {
    id: string;
    consentGiven: boolean;
    consentAt: Date | null;
    cvPath: string | null;
    coverLetter: string | null;
    projects: unknown;
    roleAnswers: unknown;
    standardAnswers: unknown;
    psychoAnswers: unknown;
    psychoScores: unknown;
    finalReflection: string | null;
    submittedAt: Date | null;
  };
  job: {
    id: string;
    title: string;
    department: string | null;
    roleQuestions: Array<{ id: string; prompt: string; wordLimit: number; sortOrder: number }>;
  };
  invite: {
    id: string;
    token: string;
    expiresAt: Date;
    status: string;
  };
};

export type TokenValidationResult =
  | { valid: true; invite: { id: string; token: string; jobId: string; candidateName: string; candidateEmail: string; expiresAt: Date } }
  | { valid: false; reason: "not_found" | "expired" | "revoked" };

export async function validateToken(token: string): Promise<TokenValidationResult> {
  const invite = await prisma.invite.findUnique({
    where: { token },
    select: {
      id: true,
      token: true,
      jobId: true,
      candidateName: true,
      candidateEmail: true,
      expiresAt: true,
      status: true,
    },
  });

  if (!invite) return { valid: false, reason: "not_found" };
  if (invite.status === "REVOKED") return { valid: false, reason: "revoked" };
  if (invite.expiresAt < new Date()) return { valid: false, reason: "expired" };

  return { valid: true, invite };
}

export async function getOrCreateCandidate(inviteId: string, jobId: string, name: string, email: string) {
  const existing = await prisma.candidate.findUnique({
    where: { inviteId },
    include: {
      submission: true,
    },
  });

  if (existing) {
    if (!existing.submission) {
      await prisma.submission.create({ data: { candidateId: existing.id } });
    }
    await logCandidateEvent(existing.id, jobId, "link_clicked");
    return existing;
  }

  const candidate = await prisma.candidate.create({
    data: {
      jobId,
      inviteId,
      name,
      email,
      stage: CandidateStage.IN_PROGRESS,
      currentStage: 1,
      lastActiveAt: new Date(),
      submission: {
        create: {},
      },
    },
    include: { submission: true },
  });

  await logCandidateEvent(candidate.id, jobId, "link_clicked", {
    metadata: { firstVisit: true },
  });

  return candidate;
}

export async function getApplicationState(token: string): Promise<ApplicationState | null> {
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: {
      candidate: {
        include: {
          submission: true,
          job: {
            include: {
              roleQuestions: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!invite || !invite.candidate || !invite.candidate.submission) return null;

  const { candidate } = invite;
  const submission = invite.candidate.submission;
  const { job } = candidate;

  return {
    candidate: {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      currentStage: candidate.currentStage,
      completionPercent: candidate.completionPercent,
      stage: candidate.stage,
    },
    submission: {
      id: submission.id,
      consentGiven: submission.consentGiven,
      consentAt: submission.consentAt,
      cvPath: submission.cvPath,
      coverLetter: submission.coverLetter,
      projects: submission.projects,
      roleAnswers: submission.roleAnswers,
      standardAnswers: submission.standardAnswers,
      psychoAnswers: submission.psychoAnswers,
      psychoScores: submission.psychoScores,
      finalReflection: submission.finalReflection,
      submittedAt: submission.submittedAt,
    },
    job: {
      id: job.id,
      title: job.title,
      department: job.department,
      roleQuestions: job.roleQuestions,
    },
    invite: {
      id: invite.id,
      token: invite.token,
      expiresAt: invite.expiresAt,
      status: invite.status,
    },
  };
}

export function computeCompletionPercent(state: ApplicationState): number {
  const sub = state.submission;
  const scores = [
    sub.consentGiven ? 1 : 0,
    sub.cvPath ? 1 : 0,
    Object.keys(sub.roleAnswers as Record<string, string> ?? {}).length > 0 ? 1 : 0,
    Object.keys(sub.standardAnswers as Record<string, string> ?? {}).length > 0 ? 1 : 0,
    Object.keys(sub.psychoAnswers as Record<string, number> ?? {}).length > 0 ? 1 : 0,
    sub.finalReflection ? 1 : 0,
  ];
  return Math.round((scores.reduce((a, b) => a + b, 0) / 6) * 100);
}

type PsychoItemForScoring = {
  id: string;
  itemId: string;
  itemType: string;
  options: unknown;
  construct: string;
};

export function scorePsychometric(
  items: PsychoItemForScoring[],
  answers: Record<string, string | string[]>
): Record<string, unknown> {
  const fcTallies: Record<string, number> = {};
  let t2Scores: Record<string, number> = {};
  let t1Ranking: string[] = [];
  const ccValues: Record<string, number> = {};

  for (const item of items) {
    const answer = answers[item.id];
    if (!answer) continue;
    const opts = item.options as Array<{ id: string; dimension?: string; scores?: Record<string, number> }> | null;

    if (item.itemType === "forced_choice" && typeof answer === "string" && opts) {
      const selected = opts.find((o) => o.id === answer);
      if (selected?.dimension) {
        fcTallies[selected.dimension] = (fcTallies[selected.dimension] ?? 0) + 1;
      }
    } else if (item.itemType === "tradeoff_choice" && typeof answer === "string" && opts) {
      const selected = opts.find((o) => o.id === answer);
      if (selected?.scores) t2Scores = selected.scores;
    } else if (item.itemType === "tradeoff_rank" && Array.isArray(answer)) {
      t1Ranking = answer;
    } else if (item.itemType === "consistency_check" && typeof answer === "string") {
      ccValues[item.itemId] = parseInt(answer, 10);
    }
  }

  return { fcTallies, t2Scores, t1Ranking, ccValues };
}
