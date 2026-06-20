-- Reusable bulk invite links: one URL self-serves many candidate registrations.

CREATE TABLE "BulkInviteLink" (
  "id"             TEXT NOT NULL,
  "jobId"          TEXT NOT NULL,
  "token"          TEXT NOT NULL,
  "label"          TEXT,
  "expiresAt"      TIMESTAMP(3) NOT NULL,
  "status"         "InviteStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdByEmail" TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  "revokedAt"      TIMESTAMP(3),
  CONSTRAINT "BulkInviteLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BulkInviteLink_token_key" ON "BulkInviteLink"("token");
CREATE INDEX "BulkInviteLink_jobId_createdAt_idx" ON "BulkInviteLink"("jobId", "createdAt");
CREATE INDEX "BulkInviteLink_status_expiresAt_idx" ON "BulkInviteLink"("status", "expiresAt");

ALTER TABLE "BulkInviteLink"
  ADD CONSTRAINT "BulkInviteLink_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invite"
  ADD COLUMN "bulkInviteLinkId" TEXT;

CREATE INDEX "Invite_bulkInviteLinkId_idx" ON "Invite"("bulkInviteLinkId");

ALTER TABLE "Invite"
  ADD CONSTRAINT "Invite_bulkInviteLinkId_fkey"
  FOREIGN KEY ("bulkInviteLinkId") REFERENCES "BulkInviteLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;
