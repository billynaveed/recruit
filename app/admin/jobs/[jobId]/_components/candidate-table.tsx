"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { CandidateRow, type CandidateRowData } from "./candidate-row";
import {
  shortlistCandidateAction,
  rejectCandidateAction,
  archiveCandidateAction,
} from "@/actions/candidates";

export function CandidateTable({
  rows,
  reviewerEmails,
  jobId,
}: {
  rows: CandidateRowData[];
  reviewerEmails: string[];
  jobId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((cur) => (cur.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))));
  }

  function runBulk(
    action: (fd: FormData) => Promise<void>,
    successLabel: string
  ) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    startTransition(async () => {
      await Promise.all(
        ids.map((id) => {
          const fd = new FormData();
          fd.set("candidateId", id);
          return action(fd);
        })
      );
      toast.success(`${successLabel} ${ids.length}`, "Bulk action complete");
      setSelected(new Set());
      router.refresh();
    });
  }

  function exportSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    window.open(
      `/api/admin/jobs/${jobId}/export?ids=${encodeURIComponent(ids.join(","))}`,
      "_blank"
    );
    toast.success(`Downloading ${ids.length} candidate${ids.length === 1 ? "" : "s"}`);
  }

  function exportAll() {
    window.open(`/api/admin/jobs/${jobId}/export`, "_blank");
    toast.success("Downloading all submitted candidates");
  }

  async function bulkArchive() {
    const ok = await confirmDialog.ask({
      title: `Archive ${selected.size} candidates?`,
      description: "They will be hidden from the main views. You can restore individually.",
      confirmLabel: "Archive",
    });
    if (!ok) return;
    runBulk(archiveCandidateAction, "Archived");
  }

  const allChecked = rows.length > 0 && selected.size === rows.length;
  const someChecked = selected.size > 0 && selected.size < rows.length;

  return (
    <>
      <div className="flex items-center justify-end gap-2 border-b border-slate-100 py-2">
        <Button variant="outline" size="sm" onClick={exportAll}>
          <Download className="h-3.5 w-3.5" /> Download all to Excel
        </Button>
      </div>

      {/* Mobile card list (below md) */}
      <div className="space-y-2 py-3 md:hidden">
        {rows.map((c) => (
          <CandidateCard
            key={c.id}
            c={c}
            reviewerEmails={reviewerEmails}
            selected={selected.has(c.id)}
            onToggle={() => toggle(c.id)}
          />
        ))}
      </div>

      {/* Table (md and up) */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = someChecked;
                  }}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 rounded border-slate-300"
                />
              </th>
              <th className="px-3 py-2">Candidate</th>
              <th className="px-3 py-2">Submitted</th>
              <th className="px-3 py-2">Role fit</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Reviewer</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <CandidateRow
                key={c.id}
                c={c}
                reviewerEmails={reviewerEmails}
                selected={selected.has(c.id)}
                onToggle={() => toggle(c.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-lg">
          <span className="px-2 text-sm font-medium text-slate-700">
            {selected.size} selected
          </span>
          <span className="h-5 w-px bg-slate-200" />
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => runBulk(shortlistCandidateAction, "Shortlisted")}>
            ★ Shortlist
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => runBulk(rejectCandidateAction, "Rejected")}>
            ⊘ Reject
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={bulkArchive}>
            Archive
          </Button>
          <Button size="sm" variant="ghost" onClick={exportSelected}>
            <Download className="h-3.5 w-3.5" /> Excel
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}
      {confirmDialog.dialog}
    </>
  );
}

const ROLE_FIT_CLASSES: Record<string, string> = {
  "Strong fit": "bg-emerald-100 text-emerald-700",
  "Likely fit": "bg-emerald-50 text-emerald-700",
  "Mixed fit": "bg-amber-50 text-amber-700",
  "Weak fit": "bg-orange-50 text-orange-700",
  "Likely mis-fit": "bg-red-50 text-red-700",
};

function CandidateCard({
  c,
  selected,
  onToggle,
}: {
  c: CandidateRowData;
  reviewerEmails: string[];
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`rounded-md border p-3 ${selected ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"}`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-1 h-3.5 w-3.5 rounded border-slate-300"
        />
        <Link href={`/admin/candidates/${c.id}`} className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{c.name}</p>
          <p className="truncate text-xs text-slate-500">{c.email}</p>
        </Link>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        {c.roleFit && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_FIT_CLASSES[c.roleFit]}`}>
            {c.roleFit}
          </span>
        )}
        {c.submittedAt && (
          <span className="text-[11px] text-slate-400">
            {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(c.submittedAt)}
          </span>
        )}
      </div>
    </div>
  );
}
