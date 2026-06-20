"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updateRoleQuestionsAction } from "@/actions/jobs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Sparkles } from "lucide-react";
import { RowOverflowMenu, type MenuItem } from "@/components/admin/row-context-menu";

type Question = { prompt: string; wordLimit: number; source: string };

type Props = { jobId: string; initialQuestions: Question[] };

const initialState = {} as { success?: string; error?: string };

export function RoleQuestionsEditor({ jobId, initialQuestions }: Props) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [expandedIdxs, setExpandedIdxs] = useState<Set<number>>(
    () => new Set(initialQuestions.map((_, i) => i))
  );
  const [state, formAction] = useFormState(updateRoleQuestionsAction, initialState);

  function toggleExpanded(i: number) {
    setExpandedIdxs((cur) => {
      const next = new Set(cur);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }
  function setExpanded(i: number, on: boolean) {
    setExpandedIdxs((cur) => {
      const next = new Set(cur);
      if (on) next.add(i);
      else next.delete(i);
      return next;
    });
  }

  const questionsJson = useMemo(
    () => JSON.stringify(questions.map((q, i) => ({ ...q, sortOrder: i }))),
    [questions]
  );

  function update(i: number, patch: Partial<Question>) {
    setQuestions((cur) => cur.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  }
  function move(i: number, dir: -1 | 1) {
    const next = i + dir;
    if (next < 0 || next >= questions.length) return;
    setQuestions((cur) => {
      const clone = [...cur];
      const [item] = clone.splice(i, 1);
      clone.splice(next, 0, item);
      return clone;
    });
  }
  function remove(i: number) {
    setQuestions((cur) => cur.filter((_, j) => j !== i));
    setExpandedIdxs((cur) => {
      const next = new Set<number>();
      for (const idx of cur) {
        if (idx < i) next.add(idx);
        else if (idx > i) next.add(idx - 1);
      }
      return next;
    });
  }
  function duplicate(i: number) {
    setQuestions((cur) => {
      const clone = [...cur];
      clone.splice(i + 1, 0, { ...clone[i], source: "CUSTOM" });
      return clone;
    });
    setExpanded(i + 1, true);
  }
  function addQuestion() {
    setQuestions((cur) => [
      ...cur,
      { prompt: "New role-specific question", wordLimit: 250, source: "CUSTOM" },
    ]);
    setExpanded(questions.length, true);
  }
  function editWordLimit(i: number) {
    const raw = prompt(`Word limit for question ${i + 1}:`, String(questions[i].wordLimit));
    if (!raw) return;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 50 || n > 1500) return;
    update(i, { wordLimit: n });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yfs-accent" />
          <h2 className="text-base font-semibold text-slate-900">Role questions</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {questions.length}
          </span>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
          <Plus className="h-3.5 w-3.5" /> Add question
        </Button>
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="jobId" value={jobId} />
        <input type="hidden" name="questionsJson" value={questionsJson} />

        <div className="space-y-2">
          {questions.map((q, i) => {
            const isExpanded = expandedIdxs.has(i);
            const items: MenuItem[] = [
              { label: isExpanded ? "Collapse" : "Expand", kbd: "↵", onSelect: () => toggleExpanded(i) },
              { label: "Duplicate", kbd: "⌘D", onSelect: () => duplicate(i) },
              { type: "separator" },
              { label: "Move up", kbd: "⌘↑", disabled: i === 0, onSelect: () => move(i, -1) },
              { label: "Move down", kbd: "⌘↓", disabled: i === questions.length - 1, onSelect: () => move(i, 1) },
              { type: "separator" },
              { label: "Change word limit…", onSelect: () => editWordLimit(i) },
              { type: "separator" },
              { label: "Delete question", danger: true, onSelect: () => remove(i) },
            ];

            return (
              <div key={i} className="rounded-md border border-slate-200 bg-white">
                <div
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                  onClick={() => toggleExpanded(i)}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yfs-accent/20 text-xs font-semibold text-slate-700">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm text-slate-900 ${isExpanded ? "" : "truncate"}`}>
                      {q.prompt}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {q.wordLimit} words · {q.source}
                    </p>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <RowOverflowMenu items={items} />
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-slate-100 px-3 py-3">
                    <Textarea
                      value={q.prompt}
                      onChange={(e) => update(i, { prompt: e.target.value })}
                      rows={4}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && <p className="text-sm text-emerald-700">{state.success}</p>}

        <SaveButton />
      </form>
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? "Saving…" : "Save questions"}
    </Button>
  );
}
