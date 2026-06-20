"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { usePromptDialog } from "@/components/ui/confirm-dialog";
import { RowOverflowMenu, type MenuItem } from "@/components/admin/row-context-menu";
import {
  shortlistCandidateAction,
  rejectCandidateAction,
  moveToInReviewAction,
  archiveCandidateAction,
  unarchiveCandidateAction,
  updateCandidateNotesAction,
} from "@/actions/candidates";
import { assignReviewerAction } from "@/actions/reviews";
import { CandidateStage } from "@prisma/client";

export type RoleFitBand =
  | "Strong fit"
  | "Likely fit"
  | "Mixed fit"
  | "Weak fit"
  | "Likely mis-fit";

export type CandidateRowData = {
  id: string;
  name: string;
  email: string;
  stage: CandidateStage;
  submittedAt: Date | null;
  roleFit: RoleFitBand | null;
  reviewerInitials: string | null;
  notes: string | null;
};

const ROLE_FIT_CLASSES: Record<RoleFitBand, string> = {
  "Strong fit": "bg-emerald-100 text-emerald-700",
  "Likely fit": "bg-emerald-50 text-emerald-700",
  "Mixed fit": "bg-amber-50 text-amber-700",
  "Weak fit": "bg-orange-50 text-orange-700",
  "Likely mis-fit": "bg-red-50 text-red-700",
};

const STAGE_LABEL: Partial<Record<CandidateStage, { label: string; className: string }>> = {
  COMPLETED: { label: "Submitted", className: "bg-emerald-100 text-emerald-700" },
  REVIEWING: { label: "In review", className: "bg-violet-100 text-violet-700" },
  SHORTLISTED: { label: "Shortlisted", className: "bg-blue-100 text-blue-700" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-600" },
  ARCHIVED: { label: "Archived", className: "bg-slate-100 text-slate-500" },
  HIRED: { label: "Hired", className: "bg-emerald-600 text-white" },
  OFFER: { label: "Offer", className: "bg-indigo-100 text-indigo-700" },
  WITHDRAWN: { label: "Withdrawn", className: "bg-slate-100 text-slate-400" },
  IN_PROGRESS: { label: "In progress", className: "bg-amber-100 text-amber-700" },
};

export function CandidateRow({
  c,
  reviewerEmails,
  selected,
  onToggle,
}: {
  c: CandidateRowData;
  reviewerEmails: string[];
  selected?: boolean;
  onToggle?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const promptDialog = usePromptDialog();
  const [pending, startTransition] = useTransition();

  function action(
    formAction: (fd: FormData) => Promise<void>,
    successTitle: string,
    extra?: Record<string, string>
  ) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("candidateId", c.id);
      if (extra) for (const [k, v] of Object.entries(extra)) fd.set(k, v);
      await formAction(fd);
      toast.success(successTitle, c.name);
      router.refresh();
    });
  }

  async function editNote() {
    const next = await promptDialog.ask({
      title: c.notes ? `Edit note for ${c.name}` : `Add note for ${c.name}`,
      initialValue: c.notes ?? "",
      placeholder: "Anything relevant for the hiring team…",
      multiline: true,
      confirmLabel: "Save note",
    });
    if (next === null) return;
    startTransition(async () => {
      await updateCandidateNotesAction(c.id, next);
      toast.success(c.notes ? "Note updated" : "Note added", c.name);
      router.refresh();
    });
  }

  function copyEmail() {
    navigator.clipboard
      .writeText(c.email)
      .then(() => toast.success("Email copied", c.email))
      .catch(() => toast.error("Couldn't copy", "Clipboard unavailable"));
  }

  const isArchived = c.stage === CandidateStage.ARCHIVED;

  const items: MenuItem[] = [
    {
      label: "View profile",
      kbd: "↵",
      onSelect: () => router.push(`/admin/candidates/${c.id}`),
    },
    {
      label: "Open in new tab",
      kbd: "⌘↵",
      onSelect: () => window.open(`/admin/candidates/${c.id}`, "_blank", "noopener"),
    },
    { type: "separator" },
    { type: "label", label: "Status" },
    { label: "★ Shortlist", onSelect: () => action(shortlistCandidateAction, "Shortlisted") },
    { label: "Move to in-review", onSelect: () => action(moveToInReviewAction, "Moved to in-review") },
    { label: "⊘ Reject", onSelect: () => action(rejectCandidateAction, "Rejected") },
    { type: "separator" },
    {
      type: "submenu",
      label: "Assign reviewer…",
      items: reviewerEmails.map((email) => ({
        label: email,
        onSelect: () => action(assignReviewerAction, `Assigned to ${email}`, { reviewerEmail: email }),
      })),
    },
    { label: c.notes ? "Edit note…" : "Add note…", onSelect: editNote },
    { type: "separator" },
    { label: "Copy email", kbd: "⌘C", onSelect: copyEmail },
    { type: "separator" },
    isArchived
      ? { label: "Restore from archive", onSelect: () => action(unarchiveCandidateAction, "Restored") }
      : { label: "Archive candidate", onSelect: () => action(archiveCandidateAction, "Archived") },
  ];

  const stageLabel = STAGE_LABEL[c.stage];

  return (
    <tr
      className={`group cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 ${
        pending ? "opacity-60" : ""
      }`}
      onClick={() => router.push(`/admin/candidates/${c.id}`)}
    >
      <td className="w-8 px-3 py-2" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={!!selected}
          onChange={() => onToggle?.()}
          className="h-3.5 w-3.5 rounded border-slate-300"
        />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2.5">
          <Avatar initials={initials(c.name)} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">{c.name}</p>
            <p className="truncate text-xs text-slate-500">{c.email}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 text-sm text-slate-600">
        {c.submittedAt
          ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(c.submittedAt)
          : "—"}
      </td>
      <td className="px-3 py-2">
        {c.roleFit ? (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_FIT_CLASSES[c.roleFit]}`}>
            {c.roleFit}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
      <td className="px-3 py-2">
        {stageLabel && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${stageLabel.className}`}>
            {stageLabel.label}
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-xs text-slate-500">{c.reviewerInitials ?? "—"}</td>
      <td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            title="Shortlist"
            className="rounded-md p-1 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
            onClick={() => action(shortlistCandidateAction, "Shortlisted")}
          >
            ★
          </button>
          <button
            type="button"
            title="Reject"
            className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
            onClick={() => action(rejectCandidateAction, "Rejected")}
          >
            ⊘
          </button>
          <RowOverflowMenu items={items} />
        </div>
        {promptDialog.dialog}
      </td>
    </tr>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
      {initials || "?"}
    </div>
  );
}
