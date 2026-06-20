"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { BorderedOverflowMenu, type MenuItem } from "@/components/admin/row-context-menu";
import { setJobStatusAction, deleteJobAction } from "@/actions/jobs";

export function JobMenu({
  jobId,
  jobTitle,
  hasReusableLink,
  reusableLinkUrl,
}: {
  jobId: string;
  jobTitle: string;
  hasReusableLink: boolean;
  reusableLinkUrl: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [, startTransition] = useTransition();

  function setStatus(status: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED", successMsg: string) {
    startTransition(async () => {
      await setJobStatusAction(jobId, status);
      toast.success(successMsg, jobTitle);
      router.refresh();
    });
  }

  const items: MenuItem[] = [
    { type: "label", label: `${jobTitle.toUpperCase()} ROLE` },
    {
      label: "Edit description",
      onSelect: () => router.push(`/admin/jobs/${jobId}?tab=setup`),
    },
    {
      label: "View audit log",
      onSelect: () => router.push(`/admin/jobs/${jobId}/audit`),
    },
    { type: "separator" },
    {
      label: "Copy public invite link",
      kbd: "⌘L",
      disabled: !hasReusableLink || !reusableLinkUrl,
      onSelect: () => {
        if (!reusableLinkUrl) return;
        navigator.clipboard
          .writeText(reusableLinkUrl)
          .then(() => toast.success("Public link copied"))
          .catch(() => toast.error("Couldn't copy"));
      },
    },
    { type: "separator" },
    {
      label: "Close to new applicants",
      onSelect: () => setStatus("CLOSED", "Closed to applicants"),
    },
    {
      label: "Archive role",
      onSelect: async () => {
        const ok = await confirmDialog.ask({
          title: `Archive "${jobTitle}"?`,
          description: "It will be hidden from the dashboard but all data is preserved. You can restore it later.",
          confirmLabel: "Archive",
        });
        if (ok) setStatus("ARCHIVED", "Role archived");
      },
    },
    {
      label: "Delete role…",
      danger: true,
      onSelect: async () => {
        const ok = await confirmDialog.ask({
          title: `Delete "${jobTitle}"?`,
          description:
            "This permanently removes the role and every candidate, invite, and submission attached to it. There is no undo.",
          confirmLabel: "Delete forever",
          kind: "danger",
          typeToConfirm: jobTitle,
        });
        if (!ok) return;
        startTransition(async () => {
          await deleteJobAction(jobId);
          toast.success("Role deleted", jobTitle);
          router.push("/admin");
        });
      },
    },
  ];

  return (
    <>
      <BorderedOverflowMenu items={items} label="Job options" />
      {confirmDialog.dialog}
    </>
  );
}
