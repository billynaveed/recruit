"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updateRoleQuestionsAction } from "@/actions/jobs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ArrowUp, ArrowDown, Trash2, Sparkles } from "lucide-react";

type Question = {
  prompt: string;
  wordLimit: number;
  source: string;
};

type Props = {
  jobId: string;
  initialQuestions: Question[];
};

const initialState = {} as { success?: string; error?: string };

export function JobQuestionsEditor({ jobId, initialQuestions }: Props) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [state, formAction] = useFormState(updateRoleQuestionsAction, initialState);

  const questionsJson = useMemo(
    () => JSON.stringify(questions.map((question, index) => ({ ...question, sortOrder: index }))),
    [questions]
  );

  function updateQuestion(index: number, patch: Partial<Question>) {
    setQuestions((current) =>
      current.map((question, currentIndex) =>
        currentIndex === index ? { ...question, ...patch } : question
      )
    );
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    setQuestions((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const clone = [...current];
      const [item] = clone.splice(index, 1);
      clone.splice(nextIndex, 0, item);
      return clone;
    });
  }

  function removeQuestion(index: number) {
    setQuestions((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      {
        prompt: "New role-specific question",
        wordLimit: 250,
        source: "CUSTOM",
      },
    ]);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yfs-accent" />
              Role-specific questions
            </CardTitle>
            <CardDescription>
              Edit, add, reorder, and tune the generated question set for this job.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
            <Plus className="h-4 w-4" />
            Add question
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="jobId" value={jobId} />
          <input type="hidden" name="questionsJson" value={questionsJson} />

          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={`${index}-${question.prompt}`} className="rounded-lg border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Question {index + 1}</p>
                    <p className="text-xs text-slate-500">Source: {question.source}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveQuestion(index, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveQuestion(index, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(index)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Prompt</Label>
                  <Textarea
                    value={question.prompt}
                    onChange={(event) => updateQuestion(index, { prompt: event.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-1">
                  <div className="space-y-2">
                    <Label>Word limit</Label>
                    <Input
                      type="number"
                      min={50}
                      max={1500}
                      value={question.wordLimit}
                      onChange={(event) =>
                        updateQuestion(index, { wordLimit: Number(event.target.value || 250) })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
          {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}

          <SaveButton />
        </form>
      </CardContent>
    </Card>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving questions..." : "Save questions"}
    </Button>
  );
}
