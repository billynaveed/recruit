-- Archive states for jobs and candidates + free-form admin notes per candidate.

ALTER TYPE "JobStatus" ADD VALUE 'ARCHIVED';
ALTER TYPE "CandidateStage" ADD VALUE 'ARCHIVED';

ALTER TABLE "Candidate" ADD COLUMN "notes" TEXT;
