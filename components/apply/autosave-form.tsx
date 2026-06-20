"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type SaveFn = (answers: Record<string, string>) => Promise<void>;

export function useAutosave(
  saveFn: SaveFn,
  getAnswers: () => Record<string, string>,
  intervalMs = 30000
) {
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await saveFn(getAnswers());
      setSavedAt(new Date());
    } catch {
      // Silent — don't interrupt the user
    } finally {
      setSaving(false);
    }
  }, [saveFn, getAnswers]);

  useEffect(() => {
    timerRef.current = setInterval(save, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [save, intervalMs]);

  const saveNow = useCallback(() => save(), [save]);

  return { savedAt, saving, saveNow };
}

export function SavedIndicator({ savedAt, saving }: { savedAt: Date | null; saving: boolean }) {
  if (saving) {
    return <span className="text-xs text-slate-400">Saving...</span>;
  }
  if (!savedAt) return null;
  return (
    <span className="text-xs text-slate-400">
      Saved {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}
