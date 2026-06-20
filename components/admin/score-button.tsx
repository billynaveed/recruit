"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  candidateId: string;
  hasFailures: boolean;
};

/**
 * Triggers LLM rubric scoring for a candidate's STAR items via
 * POST /api/admin/score/[candidateId]. Calls router.refresh() on success so
 * the server-rendered candidate page picks up the new ItemScore rows.
 *
 * When any item failed on a previous run, the button switches into a red
 * "Re-assess with AI" state so the admin knows a retry is meaningful.
 */
export function ScoreButton({ candidateId, hasFailures }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleScore() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/score/${candidateId}`, { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed with status ${res.status}`);
      }
      const data = (await res.json()) as { scored: number; failed: number; insufficient: number };
      if (data.failed > 0) {
        setError(`${data.failed} item(s) failed to score. Check ANTHROPIC_API_KEY or credits.`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scoring request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={handleScore}
        disabled={loading}
        variant="outline"
        size="sm"
        className={hasFailures ? "border-red-300 text-red-600 hover:bg-red-50" : ""}
      >
        {loading ? "Scoring…" : hasFailures ? "Re-assess with AI" : "Score with AI"}
      </Button>
      {error && <p className="text-xs text-red-600 max-w-xs text-right">{error}</p>}
    </div>
  );
}
