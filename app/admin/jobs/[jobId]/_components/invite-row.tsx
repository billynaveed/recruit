"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { useConfirm, usePromptDialog } from "@/components/ui/confirm-dialog";
import { RowOverflowMenu, type MenuItem } from "@/components/admin/row-context-menu";
import {
  revokeInviteAction,
  extendInviteExpiryAction,
  regenerateInviteTokenAction,
  deleteInviteAction,
  markInviteCopiedAction,
} from "@/actions/jobs";
import { applyUrl } from "@/lib/base-url";

export type InviteRowData = {
  id: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  token: string;
  status: string;
  isStale: boolean;
};

export function InviteRowMenu({ invite }: { invite: InviteRowData }) {
  const router = useRouter();
  const toast = useToast();
  const confirmDialog = useConfirm();
  const promptDialog = usePromptDialog();
  const [, startTransition] = useTransition();
  const url = applyUrl(invite.token);

  function run(fn: () => Promise<void>, successMsg: string) {
    startTransition(async () => {
      await fn();
      toast.success(successMsg, invite.candidateName);
      router.refresh();
    });
  }

  const items: MenuItem[] = [
    {
      label: "Copy invite link",
      kbd: "⌘C",
      onSelect: () => {
        navigator.clipboard
          .writeText(url)
          .then(() => toast.success("Link copied", invite.candidateEmail))
          .catch(() => toast.error("Couldn't copy"));
        markInviteCopiedAction(invite.id, invite.jobId).catch(() => {});
      },
    },
    {
      label: "Open as candidate sees",
      kbd: "⌘O",
      onSelect: () => window.open(url, "_blank", "noopener"),
    },
    { type: "separator" },
    {
      label: "Extend expiry…",
      onSelect: async () => {
        const raw = await promptDialog.ask({
          title: "Extend invite expiry",
          description: `How many additional days for ${invite.candidateName}?`,
          initialValue: "14",
          placeholder: "Days (1–180)",
          confirmLabel: "Extend",
          validate: (v) => {
            const n = parseInt(v, 10);
            if (!Number.isFinite(n) || n < 1 || n > 180) return "Enter a number between 1 and 180.";
            return null;
          },
        });
        if (!raw) return;
        const days = parseInt(raw, 10);
        run(() => extendInviteExpiryAction(invite.id, invite.jobId, days), `Expiry extended by ${days}d`);
      },
    },
    {
      label: "Regenerate token",
      onSelect: async () => {
        const ok = await confirmDialog.ask({
          title: "Regenerate the token?",
          description: "The current link will stop working immediately. Anyone with the old URL will see an expired-link page.",
          confirmLabel: "Regenerate",
        });
        if (ok) run(() => regenerateInviteTokenAction(invite.id, invite.jobId), "Token regenerated");
      },
    },
    { type: "separator" },
    {
      label: "Revoke invite",
      disabled: invite.status !== "ACTIVE",
      onSelect: () => run(() => revokeInviteAction(invite.id, invite.jobId), "Invite revoked"),
    },
    {
      label: "Delete…",
      danger: true,
      onSelect: async () => {
        const ok = await confirmDialog.ask({
          title: `Delete invite for ${invite.candidateName}?`,
          description: "This permanently removes the invite and any application data the candidate has saved. There is no undo.",
          confirmLabel: "Delete",
          kind: "danger",
        });
        if (ok) run(() => deleteInviteAction(invite.id, invite.jobId), "Invite deleted");
      },
    },
  ];

  return (
    <>
      <RowOverflowMenu items={items} />
      {confirmDialog.dialog}
      {promptDialog.dialog}
    </>
  );
}
