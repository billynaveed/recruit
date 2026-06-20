"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface RoleGroupProps {
  href?: string;
  header: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  candidateCount: number;
}

export function RoleGroup({ href, header, children, defaultOpen = false, candidateCount }: RoleGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-1 hover:bg-slate-50 transition-colors">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Collapse" : "Expand"}
          className="flex h-11 w-11 items-center justify-center text-slate-400 hover:text-slate-700"
        >
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
        </button>
        {href ? (
          <Link href={href} className="flex-1 min-w-0 py-3 pr-3 text-left">
            {header}
          </Link>
        ) : (
          <div className="flex-1 min-w-0 py-3 pr-3">{header}</div>
        )}
        <span className="hidden sm:inline pr-3 text-xs text-slate-400 shrink-0">
          {candidateCount} {candidateCount === 1 ? "candidate" : "candidates"}
        </span>
      </div>

      {open && (
        <div className="border-t border-slate-100">
          {candidateCount === 0 ? (
            <div className="px-4 py-5 text-sm text-slate-400 text-center">
              No candidates yet. Create invites to get started.
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}
