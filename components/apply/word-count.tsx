"use client";

import { useState } from "react";

export function WordCountTextarea({
  name,
  defaultValue,
  wordLimit,
  placeholder,
  rows = 6,
  required,
}: {
  name: string;
  defaultValue?: string;
  wordLimit: number;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const wordCount = value.trim() === "" ? 0 : value.trim().split(/\s+/).length;
  const over = wordCount > wordLimit;

  return (
    <div className="space-y-1">
      <textarea
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors resize-y ${
          over
            ? "border-red-300 focus:ring-red-200"
            : "border-slate-200 focus:ring-slate-200"
        }`}
      />
      <p className={`text-xs text-right ${over ? "text-red-500" : "text-slate-400"}`}>
        {wordCount} / {wordLimit} words
      </p>
    </div>
  );
}
