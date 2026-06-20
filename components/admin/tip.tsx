"use client";

import { useEffect, useState } from "react";
import { Lightbulb, X } from "lucide-react";

type Props = {
  id: string;
  title?: string;
  children: React.ReactNode;
  tone?: "info" | "amber";
};

const TONE_STYLES: Record<NonNullable<Props["tone"]>, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
};

const ICON_STYLES: Record<NonNullable<Props["tone"]>, string> = {
  info: "text-sky-500",
  amber: "text-amber-500",
};

export function Tip({ id, title, children, tone = "info" }: Props) {
  const storageKey = `tip:dismissed:${id}`;
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(storageKey) === "1";
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable client-side; initial SSR-safe state is hidden=true and we reveal on mount
      setHidden(dismissed);
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- same pattern: reveal on mount when storage is unavailable
      setHidden(false);
    }
  }, [storageKey]);

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // ignore
    }
    setHidden(true);
  }

  if (hidden) return null;

  return (
    <div
      className={`relative rounded-lg border px-4 py-3 ${TONE_STYLES[tone]} flex items-start gap-3`}
      role="note"
    >
      <Lightbulb className={`h-4 w-4 shrink-0 mt-0.5 ${ICON_STYLES[tone]}`} />
      <div className="flex-1 text-sm leading-relaxed pr-6">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className={title ? "text-[13px] opacity-90" : ""}>{children}</div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss tip"
        className="absolute top-2 right-2 p-1 rounded hover:bg-white/40 transition-colors"
      >
        <X className="h-3.5 w-3.5 opacity-60" />
      </button>
    </div>
  );
}
