import { randomBytes } from "crypto";
import { JobStatus, InviteStatus } from "@prisma/client";
import { z } from "zod";

export const jobStatusOptions = [JobStatus.DRAFT, JobStatus.OPEN, JobStatus.CLOSED] as const;

export const createJobSchema = z.object({
  title: z.string().trim().min(3, "Enter a job title").max(120, "Job title is too long"),
  department: z.string().trim().max(120, "Department is too long").optional().or(z.literal("")),
  location: z.string().trim().max(120, "Location is too long").optional().or(z.literal("")),
  employmentType: z.string().trim().max(80, "Employment type is too long").optional().or(z.literal("")),
  status: z.nativeEnum(JobStatus),
  descriptionText: z.string().trim().min(100, "Paste the job description").max(50000, "Job description is too long"),
  descriptionFileName: z.string().trim().max(255, "File name is too long").optional().or(z.literal("")),
  customQuestionPrompt: z.string().trim().max(1000, "Prompt is too long").optional().or(z.literal("")),
});

export const roleQuestionSchema = z.object({
  id: z.string().optional(),
  prompt: z.string().trim().min(10, "Question is too short").max(500, "Question is too long"),
  wordLimit: z.coerce.number().int().min(50, "Word limit must be at least 50").max(1500, "Word limit is too high"),
  sortOrder: z.coerce.number().int().min(0),
  source: z.string().trim().min(1).max(30).default("CUSTOM"),
});

export const createInviteSchema = z.object({
  jobId: z.string().cuid("Invalid job selected"),
  candidateName: z.string().trim().min(2, "Enter the candidate name").max(120, "Candidate name is too long"),
  candidateEmail: z.string().trim().email("Enter a valid email address").max(255),
  notes: z.string().trim().max(1000, "Notes are too long").optional().or(z.literal("")),
  expiresInDays: z.coerce.number().int().min(1, "Expiry must be at least 1 day").max(90, "Expiry cannot exceed 90 days"),
});

export const createBulkInviteLinkSchema = z.object({
  jobId: z.string().cuid("Invalid job selected"),
  label: z.string().trim().max(120, "Label is too long").optional().or(z.literal("")),
  expiresInDays: z.coerce.number().int().min(1, "Expiry must be at least 1 day").max(180, "Expiry cannot exceed 180 days"),
});

export const bulkInviteRegistrationSchema = z.object({
  candidateName: z.string().trim().min(2, "Enter your full name").max(120, "Name is too long"),
  candidateEmail: z.string().trim().email("Enter a valid email address").max(255),
});

export type CreateBulkInviteLinkInput = z.infer<typeof createBulkInviteLinkSchema>;
export type BulkInviteRegistrationInput = z.infer<typeof bulkInviteRegistrationSchema>;

export const bulkInviteCsvRowSchema = z.object({
  candidateName: z.string().trim().min(2, "Candidate name is required").max(120),
  candidateEmail: z.string().trim().email("Valid email is required").max(255),
  notes: z.string().trim().max(1000).optional().default(""),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type RoleQuestionInput = z.infer<typeof roleQuestionSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type BulkInviteCsvRow = z.infer<typeof bulkInviteCsvRowSchema>;

export function slugifyJobTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function uniqueJobSlug(title: string): string {
  const base = slugifyJobTitle(title) || "job";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

export function generateInviteToken(): string {
  return randomBytes(18).toString("base64url");
}

export function getInviteStatus(expiresAt: Date, revokedAt?: Date | null): InviteStatus {
  if (revokedAt) return InviteStatus.REVOKED;
  if (expiresAt.getTime() < Date.now()) return InviteStatus.EXPIRED;
  return InviteStatus.ACTIVE;
}

export function addDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function parseCsvInvites(raw: string): BulkInviteCsvRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("Paste a CSV with a header row and at least one candidate row.");
  }

  const header = splitCsvLine(lines[0]).map((value) => value.toLowerCase());
  const nameIndex = header.indexOf("name");
  const emailIndex = header.indexOf("email");
  const notesIndex = header.indexOf("notes");

  if (nameIndex === -1 || emailIndex === -1) {
    throw new Error("CSV header must include name and email columns.");
  }

  return lines.slice(1).map((line) => {
    const parts = splitCsvLine(line);
    return bulkInviteCsvRowSchema.parse({
      candidateName: parts[nameIndex] ?? "",
      candidateEmail: parts[emailIndex] ?? "",
      notes: notesIndex >= 0 ? parts[notesIndex] ?? "" : "",
    });
  }).map((row) => ({ ...row }));
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

export type GeneratedRoleQuestion = {
  prompt: string;
  wordLimit: number;
  source: string;
};

export async function generateRoleQuestionsFromDescription(input: {
  title: string;
  descriptionText: string;
  customPrompt?: string;
}): Promise<GeneratedRoleQuestion[]> {
  const title = input.title.trim();
  const promptHint = input.customPrompt?.trim();

  const baseQuestions: GeneratedRoleQuestion[] = [
    {
      prompt: `What does excellent performance in the ${title} role look like in the first 90 days, and how would you deliver it?`,
      wordLimit: 250,
      source: "STUB_GENERATED",
    },
    {
      prompt: `Tell us about a time you had to solve an ambiguous problem that is similar to the challenges in this ${title} role. What did you do, and what changed because of your work?`,
      wordLimit: 300,
      source: "STUB_GENERATED",
    },
    {
      prompt: `Describe the strongest proof of work you would point to for this ${title} application, and explain why it matters.`,
      wordLimit: 250,
      source: "STUB_GENERATED",
    },
    {
      prompt: `If you joined the team in this ${title} role next month, what would you stop, start, and improve first?`,
      wordLimit: 250,
      source: "STUB_GENERATED",
    },
    {
      prompt: `Describe a project where you had to earn trust across stakeholders with different priorities. How did you do it?`,
      wordLimit: 250,
      source: "STUB_GENERATED",
    },
    {
      prompt: `What trade-offs would you make when speed, quality, and resource constraints collide in this kind of role?`,
      wordLimit: 220,
      source: "STUB_GENERATED",
    },
    {
      prompt: `Tell us about a time you improved a broken process. What was wrong, what changed, and how did you measure the improvement?`,
      wordLimit: 280,
      source: "STUB_GENERATED",
    },
    {
      prompt: `What parts of this ${title} role play to your strengths, and where would you need to learn quickly?`,
      wordLimit: 220,
      source: "STUB_GENERATED",
    },
    {
      prompt: `Describe a moment when you showed unusual ownership or agency without being asked. What happened?`,
      wordLimit: 250,
      source: "STUB_GENERATED",
    },
    {
      prompt: promptHint
        ? `Using this added context, ${promptHint}, describe how you would approach the most important challenge in this role.`
        : `What is the hardest problem you expect in this role, and how would you approach it?`,
      wordLimit: 250,
      source: promptHint ? "STUB_CUSTOM_PROMPT" : "STUB_GENERATED",
    },
  ];

  return baseQuestions;
}
