"use client";

import { Button } from "@/components/ui/button";
import { eraseCandidateDataAction } from "@/actions/candidates";

export function EraseButton({ candidateId }: { candidateId: string }) {
  return (
    <form
      action={eraseCandidateDataAction}
      onSubmit={(e) => {
        if (!confirm("Permanently erase this candidate's personal data and responses? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="candidateId" value={candidateId} />
      <Button type="submit" variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0">
        Erase data
      </Button>
    </form>
  );
}
