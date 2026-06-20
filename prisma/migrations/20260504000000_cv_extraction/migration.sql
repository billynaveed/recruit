-- Add CV text extraction fields to Submission

ALTER TABLE "Submission"
  ADD COLUMN "cvText" TEXT,
  ADD COLUMN "cvExtractedAt" TIMESTAMP(3),
  ADD COLUMN "cvExtractError" TEXT;
