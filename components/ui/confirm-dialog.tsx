"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ConfirmKind = "default" | "danger";

export type ConfirmProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  kind?: ConfirmKind;
  typeToConfirm?: string;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  kind = "default",
  typeToConfirm,
  onConfirm,
}: ConfirmProps) {
  const [typed, setTyped] = React.useState("");
  const requiredMatch = typeToConfirm ? typed.trim() === typeToConfirm.trim() : true;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setTyped("");
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        {description && <AlertDialogDescription>{description}</AlertDialogDescription>}

        {typeToConfirm && (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs text-slate-600">
              Type <b className="font-semibold">{typeToConfirm}</b> to confirm:
            </p>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={typeToConfirm}
              autoFocus
            />
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <AlertDialogCancel asChild>
            <Button variant="ghost" size="sm">
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              size="sm"
              variant={kind === "danger" ? "destructive" : "default"}
              disabled={!requiredMatch}
              onClick={() => onConfirm()}
              className={cn()}
            >
              {confirmLabel}
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Imperative confirm: render this hook's `dialog` element somewhere, then call
 * `ask(...)` to open it and await a resolved boolean.
 */
type AskOpts = Omit<ConfirmProps, "open" | "onOpenChange" | "onConfirm">;

export function useConfirm() {
  const [state, setState] = React.useState<{
    opts: AskOpts;
    resolve: (v: boolean) => void;
  } | null>(null);

  function ask(opts: AskOpts): Promise<boolean> {
    return new Promise((resolve) => {
      setState({ opts, resolve });
    });
  }

  function handle(decision: boolean) {
    if (state) state.resolve(decision);
    setState(null);
  }

  const dialog = state ? (
    <ConfirmDialog
      {...state.opts}
      open
      onOpenChange={(open) => {
        if (!open) handle(false);
      }}
      onConfirm={() => handle(true)}
    />
  ) : null;

  return { ask, dialog };
}

/**
 * Imperative prompt-replacement: ask the user for a string.
 */
type PromptOpts = {
  title: string;
  description?: React.ReactNode;
  initialValue?: string;
  placeholder?: string;
  multiline?: boolean;
  confirmLabel?: string;
  validate?: (value: string) => string | null; // returns error message if invalid
};

export function usePromptDialog() {
  const [state, setState] = React.useState<{
    opts: PromptOpts;
    resolve: (v: string | null) => void;
  } | null>(null);
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function ask(opts: PromptOpts): Promise<string | null> {
    setValue(opts.initialValue ?? "");
    setError(null);
    return new Promise((resolve) => {
      setState({ opts, resolve });
    });
  }

  function close(v: string | null) {
    if (state) state.resolve(v);
    setState(null);
    setError(null);
  }

  function confirm() {
    if (!state) return;
    const err = state.opts.validate ? state.opts.validate(value) : null;
    if (err) {
      setError(err);
      return;
    }
    close(value);
  }

  const dialog = state ? (
    <AlertDialog open onOpenChange={(open) => { if (!open) close(null); }}>
      <AlertDialogContent>
        <AlertDialogTitle>{state.opts.title}</AlertDialogTitle>
        {state.opts.description && (
          <AlertDialogDescription>{state.opts.description}</AlertDialogDescription>
        )}
        <div className="mt-3">
          {state.opts.multiline ? (
            <textarea
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(null); }}
              placeholder={state.opts.placeholder}
              rows={5}
              autoFocus
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yfs-accent"
            />
          ) : (
            <Input
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(null); }}
              placeholder={state.opts.placeholder}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") confirm(); }}
            />
          )}
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <AlertDialogCancel asChild>
            <Button variant="ghost" size="sm">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button size="sm" onClick={confirm}>
              {state.opts.confirmLabel ?? "Save"}
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  ) : null;

  return { ask, dialog };
}
