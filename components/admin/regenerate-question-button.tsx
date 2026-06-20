"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

type Props = {
  candidateId: string;
  targetId: string;
  surface: "flag" | "dimension";
  onRegenerate: (newQuestion: string) => void;
};

export function RegenerateQuestionButton({ candidateId, targetId, surface, onRegenerate }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/candidates/${candidateId}/regenerate-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, surface }),
      });
      if (!res.ok) {
        setError("Failed to regenerate");
        return;
      }
      const data = await res.json() as { question?: string };
      if (data.question) onRegenerate(data.question);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-[10px] text-slate-400 hover:text-slate-600 disabled:opacity-50 flex items-center gap-0.5 transition-colors"
        title="Regenerate this question"
      >
        <RefreshCw className={`h-2.5 w-2.5 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Regenerating…" : "Regenerate"}
      </button>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </span>
  );
}
