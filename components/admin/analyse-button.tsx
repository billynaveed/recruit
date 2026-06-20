"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";

type Props = {
  candidateId: string;
  hasExisting: boolean;
};

/**
 * Combined Score → Synthesise button. Runs both steps sequentially so admins
 * never need to manually coordinate the two-step flow or deal with stale-data
 * warnings after scoring.
 */
export function AnalyseButton({ candidateId, hasExisting }: Props) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"scoring" | "analysing" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Score STAR items
      setStep("scoring");
      const scoreRes = await fetch(`/api/admin/score/${candidateId}`, { method: "POST" });
      if (!scoreRes.ok) {
        const body = (await scoreRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Scoring failed (${scoreRes.status})`);
      }
      const scoreData = (await scoreRes.json()) as {
        scored: number;
        failed: number;
        insufficient: number;
      };
      if (scoreData.failed > 0) {
        throw new Error(
          `${scoreData.failed} item(s) failed to score. Check ANTHROPIC_API_KEY or credits.`
        );
      }

      // Step 2: Synthesise
      setStep("analysing");
      const synthRes = await fetch(`/api/admin/synthesize/${candidateId}`, { method: "POST" });
      if (!synthRes.ok) {
        const body = (await synthRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Synthesis failed (${synthRes.status})`);
      }

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
      setStep(null);
    }
  }

  const label = loading
    ? step === "scoring"
      ? "Scoring…"
      : "Analysing…"
    : hasExisting
      ? "Re-analyse"
      : "Analyse candidate";

  const Icon = loading ? Loader2 : hasExisting ? RefreshCw : Sparkles;

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={handleClick} disabled={loading} variant="outline" size="sm">
        <Icon className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
        {label}
      </Button>
      {error && <p className="text-xs text-red-600 max-w-xs text-right">{error}</p>}
    </div>
  );
}
