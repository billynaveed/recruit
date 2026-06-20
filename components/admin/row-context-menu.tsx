"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type MenuItem =
  | {
      type?: "item";
      label: React.ReactNode;
      kbd?: string;
      danger?: boolean;
      disabled?: boolean;
      onSelect?: () => void;
    }
  | { type: "separator" }
  | { type: "label"; label: React.ReactNode }
  | {
      type: "submenu";
      label: React.ReactNode;
      items: MenuItem[];
    };

function renderItems(items: MenuItem[]): React.ReactNode {
  return items.map((item, idx) => {
    if ("type" in item && item.type === "separator") {
      return <DropdownMenuSeparator key={idx} />;
    }
    if ("type" in item && item.type === "label") {
      return <DropdownMenuLabel key={idx}>{item.label}</DropdownMenuLabel>;
    }
    if ("type" in item && item.type === "submenu") {
      return (
        <DropdownMenuSub key={idx}>
          <DropdownMenuSubTrigger>
            <span>{item.label}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>{renderItems(item.items)}</DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      );
    }
    const it = item;
    return (
      <DropdownMenuItem
        key={idx}
        danger={it.danger}
        disabled={it.disabled}
        onSelect={(e) => {
          e.preventDefault();
          it.onSelect?.();
        }}
      >
        <span>{it.label}</span>
        {it.kbd && <DropdownMenuShortcut>{it.kbd}</DropdownMenuShortcut>}
      </DropdownMenuItem>
    );
  });
}

/**
 * RowOverflowMenu — the ⋯ button + menu used on table rows and other inline
 * surfaces. Stops click propagation so the row's own onClick doesn't fire.
 */
export function RowOverflowMenu({
  items,
  align = "end",
  className,
  size = "sm",
}: {
  items: MenuItem[];
  align?: "start" | "center" | "end";
  className?: string;
  size?: "sm" | "md";
}) {
  if (items.length === 0) return null;
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open row menu"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            dim,
            "inline-flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700",
            className
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>{renderItems(items)}</DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * BorderedOverflowMenu — same menu config, but wrapped in a bordered button.
 * Use for non-row triggers like a page header.
 */
export function BorderedOverflowMenu({
  items,
  label = "Open menu",
  className,
}: {
  items: MenuItem[];
  label?: string;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
            className
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{renderItems(items)}</DropdownMenuContent>
    </DropdownMenu>
  );
}
