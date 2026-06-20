"use client";

import { useState, useCallback } from "react";
import { saveStage5Action } from "@/actions/apply";
import { deleteApplicationAction } from "@/actions/apply";

type FCOption = { id: string; text: string; dimension?: string };
type ChoiceOption = { id: string; text: string; scores?: Record<string, number> };
type RankOption = { id: string; text: string };

type AssessmentItem = {
  id: string;
  itemId: string;
  itemType: string;
  body: string;
  options: unknown;
  construct: string;
  minLength: number | null;
  sortOrder: number;
};

// ─── Item renderers ──────────────────────────────────────────────────────────

function StarBehavioralItem({
  item,
  initialValue,
  onChange,
}: {
  item: AssessmentItem;
  initialValue: string;
  onChange: (val: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const charCount = value.length;
  const min = item.minLength ?? 0;
  const meetsMin = charCount >= min;

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    onChange(e.target.value);
  }

  const parts = item.body.split("\n\n");
  return (
    <div className="space-y-2">
      {parts.map((para, i) => (
        <p key={i} className={i === 0 ? "text-sm font-medium text-slate-900" : "text-sm text-slate-500 italic"}>
          {para}
        </p>
      ))}
      <textarea
        name={`item_${item.id}`}
        value={value}
        onChange={handleChange}
        rows={8}
        placeholder="Write your answer here..."
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-y"
      />
      <div className={`text-xs text-right ${meetsMin ? "text-slate-400" : "text-amber-600"}`}>
        {charCount} characters{min > 0 && ` (minimum ${min})`}
      </div>
    </div>
  );
}

function ForcedChoiceItem({
  item,
  initialValue,
  onChange,
}: {
  item: AssessmentItem;
  initialValue: string;
  onChange: (val: string) => void;
}) {
  const [selected, setSelected] = useState(initialValue);
  const options = item.options as FCOption[];

  function handleChange(id: string) {
    setSelected(id);
    onChange(id);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-900">{item.body}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => (
          <label
            key={opt.id}
            className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
              selected === opt.id
                ? "border-slate-900 bg-slate-50"
                : "border-slate-200 hover:border-slate-400"
            }`}
          >
            <input
              type="radio"
              name={`item_${item.id}`}
              value={opt.id}
              checked={selected === opt.id}
              onChange={() => handleChange(opt.id)}
              className="sr-only"
            />
            <span className="text-sm text-slate-800">{opt.text}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function TradeoffChoiceItem({
  item,
  initialValue,
  onChange,
}: {
  item: AssessmentItem;
  initialValue: string;
  onChange: (val: string) => void;
}) {
  const [selected, setSelected] = useState(initialValue);
  const options = item.options as ChoiceOption[];
  const labels = ["A", "B", "C", "D"];

  function handleChange(id: string) {
    setSelected(id);
    onChange(id);
  }

  const parts = item.body.split("\n\n");
  return (
    <div className="space-y-3">
      {parts.map((para, i) => (
        <p key={i} className="text-sm font-medium text-slate-900">{para}</p>
      ))}
      <div className="space-y-2">
        {options.map((opt, i) => (
          <label
            key={opt.id}
            className={`flex cursor-pointer gap-3 rounded-lg border-2 p-3 transition-colors ${
              selected === opt.id
                ? "border-slate-900 bg-slate-50"
                : "border-slate-200 hover:border-slate-400"
            }`}
          >
            <input
              type="radio"
              name={`item_${item.id}`}
              value={opt.id}
              checked={selected === opt.id}
              onChange={() => handleChange(opt.id)}
              className="sr-only"
            />
            <span className="flex-shrink-0 font-semibold text-sm text-slate-500 w-4">{labels[i]}.</span>
            <span className="text-sm text-slate-800">{opt.text}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function TradeoffRankItem({
  item,
  initialValue,
  onChange,
}: {
  item: AssessmentItem;
  initialValue: string[];
  onChange: (val: string[]) => void;
}) {
  const options = item.options as RankOption[];
  const [ranks, setRanks] = useState<Record<string, string>>(() => {
    const r: Record<string, string> = {};
    if (initialValue.length > 0) {
      initialValue.forEach((id, i) => { r[id] = String(i + 1); });
    }
    return r;
  });

  const rankString = options
    .map((opt) => ({ id: opt.id, rank: parseInt(ranks[opt.id] ?? "0") }))
    .filter((x) => x.rank > 0)
    .sort((a, b) => a.rank - b.rank)
    .map((x) => x.id)
    .join(",");

  function usedRanks(excludeId: string) {
    return new Set(Object.entries(ranks).filter(([id]) => id !== excludeId).map(([, v]) => v));
  }

  function handleRankChange(optId: string, rank: string) {
    const next = { ...ranks, [optId]: rank };
    setRanks(next);
    const ordered = options
      .map((opt) => ({ id: opt.id, rank: parseInt(next[opt.id] ?? "0") }))
      .filter((x) => x.rank > 0)
      .sort((a, b) => a.rank - b.rank)
      .map((x) => x.id);
    onChange(ordered);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-900">{item.body}</p>
      <p className="text-xs text-slate-500">1 = most preferred, {options.length} = least preferred. Each rank can only be used once.</p>
      <input type="hidden" name={`item_${item.id}`} value={rankString} />
      <div className="space-y-2">
        {options.map((opt) => {
          const used = usedRanks(opt.id);
          return (
            <div key={opt.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3">
              <select
                value={ranks[opt.id] ?? ""}
                onChange={(e) => handleRankChange(opt.id, e.target.value)}
                className="w-16 rounded border border-slate-200 px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">—</option>
                {Array.from({ length: options.length }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={String(n)} disabled={used.has(String(n))}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-sm text-slate-800">{opt.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConsistencyCheckItem({
  item,
  initialValue,
  onChange,
}: {
  item: AssessmentItem;
  initialValue: string;
  onChange: (val: string) => void;
}) {
  const [selected, setSelected] = useState(initialValue);
  const labels = ["Strongly disagree", "Disagree", "Neither", "Agree", "Strongly agree"];
  const parts = item.body.split("\n\n");
  const prompt = parts[0];
  const statement = parts[1] ?? "";

  function handleChange(val: string) {
    setSelected(val);
    onChange(val);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-900">{prompt}</p>
      {statement && (
        <p className="text-sm text-slate-700 italic pl-4 border-l-2 border-slate-200">{statement}</p>
      )}
      <div className="flex gap-2 sm:gap-3">
        {labels.map((label, i) => {
          const val = String(i + 1);
          return (
            <label
              key={i}
              className={`flex flex-1 flex-col items-center gap-1 cursor-pointer rounded-lg border-2 p-2 transition-colors ${
                selected === val ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-400"
              }`}
            >
              <input
                type="radio"
                name={`item_${item.id}`}
                value={val}
                checked={selected === val}
                onChange={() => handleChange(val)}
                className="sr-only"
              />
              <span className="text-[10px] text-center text-slate-700 leading-tight">{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ReflectionItem({
  item,
  initialValue,
  onChange,
}: {
  item: AssessmentItem;
  initialValue: string;
  onChange: (val: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    onChange(e.target.value);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-900">{item.body}</p>
      <p className="text-xs text-slate-500">Optional — there is no right answer here.</p>
      <textarea
        name={`item_${item.id}`}
        value={value}
        onChange={handleChange}
        rows={6}
        placeholder="Your answer (optional)..."
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-y"
      />
    </div>
  );
}

// ─── Main Stage 5 component ─────────────────────────────────────────────────

export function Stage5({
  token,
  items,
  initialAnswers,
}: {
  token: string;
  items: AssessmentItem[];
  initialAnswers: Record<string, string | string[]>;
}) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(initialAnswers);

  const updateAnswer = useCallback((id: string, val: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  }, []);

  const requiredItems = items.filter((it) => it.itemType !== "reflection");
  const canSubmit = requiredItems.every((item) => {
    const ans = answers[item.id];
    if (!ans) return false;
    if (item.itemType === "star_behavioral") {
      return typeof ans === "string" && ans.length >= (item.minLength ?? 0);
    }
    if (item.itemType === "tradeoff_rank") {
      const optCount = Array.isArray(item.options) ? item.options.length : 4;
      return Array.isArray(ans) && ans.length === optCount;
    }
    return typeof ans === "string" && ans.length > 0;
  });

  // Section groups (by flow order from spec)
  const FC_A = ["C-F1","C-F2","C-F3","C-F4","C-F5","C-F6","C-F7"];
  const FC_B = ["C-F8","C-F9","C-F10","C-F11","C-F12","C-F13"];

  const sections: { label: string | null; sublabel?: string; itemIds: string[] }[] = [
    { label: null, itemIds: ["C-S1"] },
    { label: "Quick questions", sublabel: "Pick the option that feels most like you. There are no right answers.", itemIds: FC_A },
    { label: null, itemIds: ["C-S2", "C-S3"] },
    { label: "More quick questions", sublabel: "Pick the option that feels most like you.", itemIds: FC_B },
    { label: null, itemIds: ["C-T1", "C-T2"] },
    { label: null, itemIds: ["C-S4"] },
    { label: null, itemIds: ["C-CC1", "C-CC2", "C-R1"] },
  ];

  let openEndedIndex = 0;

  function renderItem(item: AssessmentItem) {
    const initialStr = typeof initialAnswers[item.id] === "string" ? (initialAnswers[item.id] as string) : "";
    const initialArr = Array.isArray(initialAnswers[item.id]) ? (initialAnswers[item.id] as string[]) : [];

    switch (item.itemType) {
      case "star_behavioral": {
        const idx = openEndedIndex++;
        return (
          <div key={item.id} className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Question {idx + 1}</div>
            <StarBehavioralItem item={item} initialValue={initialStr} onChange={(v) => updateAnswer(item.id, v)} />
          </div>
        );
      }
      case "forced_choice":
        return (
          <div key={item.id} className="py-1">
            <ForcedChoiceItem item={item} initialValue={initialStr} onChange={(v) => updateAnswer(item.id, v)} />
          </div>
        );
      case "tradeoff_choice": {
        const idx = openEndedIndex++;
        return (
          <div key={item.id} className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Question {idx + 1}</div>
            <TradeoffChoiceItem item={item} initialValue={initialStr} onChange={(v) => updateAnswer(item.id, v)} />
          </div>
        );
      }
      case "tradeoff_rank": {
        const idx = openEndedIndex++;
        return (
          <div key={item.id} className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Question {idx + 1}</div>
            <TradeoffRankItem item={item} initialValue={initialArr} onChange={(v) => updateAnswer(item.id, v)} />
          </div>
        );
      }
      case "consistency_check":
        return (
          <div key={item.id} className="py-1">
            <ConsistencyCheckItem item={item} initialValue={initialStr} onChange={(v) => updateAnswer(item.id, v)} />
          </div>
        );
      case "reflection":
        return (
          <div key={item.id} className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Final question</div>
            <ReflectionItem item={item} initialValue={initialStr} onChange={(v) => updateAnswer(item.id, v)} />
          </div>
        );
      default:
        return null;
    }
  }

  const itemById = Object.fromEntries(items.map((it) => [it.itemId, it]));

  return (
    <form action={saveStage5Action} className="space-y-10">
      <input type="hidden" name="token" value={token} />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Assessment</h1>
        <p className="text-slate-500 text-sm">
          This section has a mix of question types — written responses, quick paired choices, and a ranking.
          Take your time. There are no right or wrong answers. Expected time: 25–30 minutes.
        </p>
      </div>

      {sections.map((section, si) => {
        const sectionItems = section.itemIds.map((id) => itemById[id]).filter(Boolean);
        if (sectionItems.length === 0) return null;
        return (
          <div key={si} className="space-y-6">
            {section.label && (
              <div className="border-t border-slate-200 pt-6">
                <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{section.label}</h2>
                {section.sublabel && (
                  <p className="text-xs text-slate-400 mt-1">{section.sublabel}</p>
                )}
              </div>
            )}
            <div className={section.label ? "space-y-4" : "space-y-8"}>
              {sectionItems.map((item) => renderItem(item))}
            </div>
            {si < sections.length - 1 && !section.label && (
              <hr className="border-slate-100 mt-4" />
            )}
          </div>
        );
      })}

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="submit"
          formAction={deleteApplicationAction}
          className="text-xs text-slate-400 hover:text-red-500 transition-colors"
          onClick={(e) => {
            if (!confirm("Are you sure you want to delete your application? This cannot be undone.")) {
              e.preventDefault();
            }
          }}
        >
          Delete my application
        </button>

        <div className="flex items-center gap-4">
          {!canSubmit && (
            <span className="text-xs text-slate-400">Complete all required questions to continue</span>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="bg-slate-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next: Review &amp; Submit
          </button>
        </div>
      </div>
    </form>
  );
}
