"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";

type Props = {
  candidateId: string;
  initialTopThree: string[];
  gapQuestions?: string[];   // open questions from signal gaps (formerly separate section)
  hasNoFlags?: boolean;      // synthesis ran but zero pattern flags fired
};

export function InterviewFocusPanel({ candidateId, initialTopThree, gapQuestions = [], hasNoFlags = false }: Props) {
  const [flagQuestions, setFlagQuestions] = useState(initialTopThree);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState<number | null>(null);

  const allQuestions = [...flagQuestions, ...gapQuestions];
  const hasAny = allQuestions.length > 0;

  async function copyAll() {
    const text = allQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Interview focus</p>
        {hasAny && (
          <button
            onClick={copyAll}
            className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
            title="Copy all questions"
          >
            {copied ? (
              <><Check className="h-3 w-3 text-emerald-500" /><span className="text-emerald-500">Copied</span></>
            ) : (
              <><Copy className="h-3 w-3" /><span>Copy all</span></>
            )}
          </button>
        )}
      </div>

      {/* Flag-derived questions */}
      {flagQuestions.length > 0 && (
        <ol className="space-y-3">
          {flagQuestions.map((q, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 text-sm font-semibold text-slate-300 mt-0.5">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>
                  &ldquo;{q}&rdquo;
                </p>
              </div>
              <button
                onClick={() => { setRegenerating(i); setTimeout(() => setRegenerating(null), 1200); }}
                disabled={regenerating === i}
                className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors mt-0.5 disabled:opacity-40"
                title="Re-analyse candidate to regenerate this question"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${regenerating === i ? "animate-spin" : ""}`} />
              </button>
            </li>
          ))}
        </ol>
      )}

      {/* Gap questions — signal gaps (consolidated from Open Questions section) */}
      {gapQuestions.length > 0 && (
        <>
          {flagQuestions.length > 0 && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 pt-1">From signal gaps</p>
          )}
          <ol className="space-y-3" start={flagQuestions.length + 1}>
            {gapQuestions.map((q, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 text-sm font-semibold text-slate-300 mt-0.5">{flagQuestions.length + i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600 leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>
                    &ldquo;{q}&rdquo;
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}

      {/* No questions at all */}
      {!hasAny && (
        hasNoFlags ? (
          <p className="text-xs text-slate-500 leading-relaxed">
            No pattern flags. Use standard competency probes and reference checks. Re-analyse to generate dimension-specific gap questions if needed.
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic">Re-analyse to generate candidate-specific interview probes.</p>
        )
      )}
    </div>
  );
}
