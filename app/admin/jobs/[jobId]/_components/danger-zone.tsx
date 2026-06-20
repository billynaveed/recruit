"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setJobStatusAction, deleteJobAction } from "@/actions/jobs";

export function DangerZone({
  jobId,
  jobTitle,
  status,
}: {
  jobId: string;
  jobTitle: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typed, setTyped] = useState("");

  function setStatus(next: "CLOSED" | "ARCHIVED") {
    startTransition(async () => {
      await setJobStatusAction(jobId, next);
      router.refresh();
    });
  }

  function tryDelete() {
    if (typed.trim() !== jobTitle.trim()) return;
    startTransition(async () => {
      await deleteJobAction(jobId);
      router.push("/admin");
    });
  }

  return (
    <div className="rounded-md border border-dashed border-red-200 bg-red-50/40 p-4">
      <h3 className="text-sm font-semibold text-red-700">Danger zone</h3>
      <p className="mt-1 text-xs text-slate-500">
        Close, archive, or delete this role. Archive hides it from the dashboard but preserves
        data. Delete removes the role and all its candidates permanently.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || status === "CLOSED" || status === "ARCHIVED"}
          onClick={() => setStatus("CLOSED")}
        >
          Close to applicants
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || status === "ARCHIVED"}
          onClick={() => setStatus("ARCHIVED")}
        >
          Archive role
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => setConfirmDelete(true)}
        >
          Delete role…
        </Button>
      </div>

      {confirmDelete && (
        <div className="mt-4 rounded-md border border-red-300 bg-white p-3">
          <Label htmlFor="confirm-delete" className="text-xs text-slate-700">
            Type the role name to confirm: <b>{jobTitle}</b>
          </Label>
          <Input
            id="confirm-delete"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={jobTitle}
            className="mt-1.5"
            autoFocus
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setConfirmDelete(false);
                setTyped("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={pending || typed.trim() !== jobTitle.trim()}
              onClick={tryDelete}
            >
              {pending ? "Deleting…" : "Delete forever"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
