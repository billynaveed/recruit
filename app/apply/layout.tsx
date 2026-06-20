import type { ReactNode } from "react";
import { APP_NAME, ORG_NAME } from "@/lib/site-config";

export default function ApplyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-slate-900">{APP_NAME}</span>
          <span className="text-slate-300">|</span>
          <span className="text-sm text-slate-500">Application</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center py-8 px-4">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-400 space-x-3">
        <span>{ORG_NAME}</span>
        <span>·</span>
        <a href="/privacy" className="hover:text-slate-600 transition-colors">Privacy</a>
        <span>·</span>
        <a href="/terms" className="hover:text-slate-600 transition-colors">Terms</a>
      </footer>
    </div>
  );
}
