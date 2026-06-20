import { redirect } from "next/navigation";
import { validateToken, getOrCreateCandidate } from "@/lib/apply";

export default async function ApplyEntryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const result = await validateToken(token);

  if (!result.valid) {
    redirect(`/apply/${token}/expired`);
  }

  const { invite } = result;

  const candidate = await getOrCreateCandidate(
    invite.id,
    invite.jobId,
    invite.candidateName,
    invite.candidateEmail
  );

  if (candidate.stage === "COMPLETED") {
    redirect(`/apply/${token}/submitted`);
  }

  redirect(`/apply/${token}/stage/${candidate.currentStage}`);
}
