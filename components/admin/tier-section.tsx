"use client";

import { useState, useLayoutEffect } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  storageKey: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
};

export function TierSection({ storageKey, title, children, defaultOpen = false, badge }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    const stored = localStorage.getItem(`recruit-tier-${storageKey}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(stored !== null ? stored === "true" : defaultOpen);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function toggle() {
    const next = !open;
    setOpen(next);
    localStorage.setItem(`recruit-tier-${storageKey}`, String(next));
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{title}</span>
          {badge && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{badge}</span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {/* Render on server (no hydration), hide until hydrated if needed */}
      <div className={hydrated ? (open ? "block" : "hidden") : (defaultOpen ? "block" : "hidden")}>
        <div className="border-t border-slate-100 px-5 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
