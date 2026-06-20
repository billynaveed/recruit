"use client";

import { useState } from "react";
import { RegenerateQuestionButton } from "./regenerate-question-button";

type Props = {
  candidateId: string;
  targetId: string;
  surface: "flag" | "dimension";
  initialQuestion: string;
};

export function FollowUpQuestion({ candidateId, targetId, surface, initialQuestion }: Props) {
  const [question, setQuestion] = useState(initialQuestion);

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-200/70 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Suggested probe</p>
        <RegenerateQuestionButton
          candidateId={candidateId}
          targetId={targetId}
          surface={surface}
          onRegenerate={setQuestion}
        />
      </div>
      <p className="text-sm text-slate-700 italic">&ldquo;{question}&rdquo;</p>
    </div>
  );
}
