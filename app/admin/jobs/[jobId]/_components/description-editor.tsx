"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateJobDescriptionAction } from "@/actions/jobs";

export function DescriptionEditor({
  jobId,
  initial,
}: {
  jobId: string;
  initial: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const dirty = value.trim() !== initial.trim();

  function save() {
    if (!dirty) return;
    startTransition(async () => {
      await updateJobDescriptionAction(jobId, value);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={18}
        className="font-sans text-sm"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {value.trim().length} characters{value.trim().length < 100 && " · minimum 100"}
        </p>
        <Button size="sm" disabled={!dirty || pending} onClick={save}>
          {pending ? "Saving…" : dirty ? "Save description" : "Saved"}
        </Button>
      </div>
    </div>
  );
}
