import { prisma } from "@/lib/prisma";

const SESSION_IDLE_MS = 30 * 60 * 1000;

export type CandidateEventType =
  | "link_clicked"
  | "session_started"
  | "stage_viewed"
  | "stage_completed"
  | "application_submitted"
  | "save_and_exit"
  | "cv_uploaded";

interface LogOptions {
  stage?: number;
  metadata?: Record<string, unknown>;
  userAgent?: string;
}

/**
 * Records a candidate event and rolls up session state.
 *
 * Sessions are implicit: events that arrive within 30 minutes of the previous event
 * extend the active session; otherwise a new session is created. durationSeconds is
 * recomputed each time as (lastEventAt - startedAt) so it never includes idle gaps.
 */
export async function logCandidateEvent(
  candidateId: string,
  jobId: string,
  eventType: CandidateEventType,
  options: LogOptions = {}
): Promise<void> {
  const now = new Date();

  const latestSession = await prisma.candidateSession.findFirst({
    where: { candidateId },
    orderBy: { startedAt: "desc" },
  });

  let sessionId: string;
  if (
    latestSession &&
    now.getTime() - latestSession.lastEventAt.getTime() <= SESSION_IDLE_MS
  ) {
    const durationSeconds = Math.floor(
      (now.getTime() - latestSession.startedAt.getTime()) / 1000
    );
    await prisma.candidateSession.update({
      where: { id: latestSession.id },
      data: { lastEventAt: now, durationSeconds },
    });
    sessionId = latestSession.id;
  } else {
    const newSession = await prisma.candidateSession.create({
      data: {
        candidateId,
        startedAt: now,
        lastEventAt: now,
        durationSeconds: 0,
        userAgent: options.userAgent ?? null,
      },
    });
    sessionId = newSession.id;
  }

  await prisma.$transaction([
    prisma.candidateEvent.create({
      data: {
        candidateId,
        jobId,
        sessionId,
        eventType,
        stage: options.stage ?? null,
        metadataJson: options.metadata ? JSON.stringify(options.metadata) : null,
        occurredAt: now,
      },
    }),
    prisma.candidate.update({
      where: { id: candidateId },
      data: { lastActiveAt: now },
    }),
  ]);
}

export interface CandidateEngagement {
  sessionCount: number;
  totalTimeSeconds: number;
  averageSessionSeconds: number;
  firstOpenedAt: Date | null;
  lastActiveAt: Date | null;
  eventCount: number;
}

export async function getCandidateEngagement(
  candidateId: string
): Promise<CandidateEngagement> {
  const [sessions, eventCount] = await Promise.all([
    prisma.candidateSession.findMany({
      where: { candidateId },
      orderBy: { startedAt: "asc" },
      select: { startedAt: true, lastEventAt: true, durationSeconds: true },
    }),
    prisma.candidateEvent.count({ where: { candidateId } }),
  ]);

  if (sessions.length === 0) {
    return {
      sessionCount: 0,
      totalTimeSeconds: 0,
      averageSessionSeconds: 0,
      firstOpenedAt: null,
      lastActiveAt: null,
      eventCount,
    };
  }

  const totalTimeSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);

  return {
    sessionCount: sessions.length,
    totalTimeSeconds,
    averageSessionSeconds: Math.floor(totalTimeSeconds / sessions.length),
    firstOpenedAt: sessions[0].startedAt,
    lastActiveAt: sessions[sessions.length - 1].lastEventAt,
    eventCount,
  };
}

export function formatDurationShort(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
}
