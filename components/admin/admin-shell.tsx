"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ToastProvider } from "@/components/ui/toast";
import { SidebarJobItem, type SidebarJob } from "@/components/admin/sidebar-job-item";
import { BarChart3, Briefcase, ChevronDown, ChevronRight, ClipboardCheck, HelpCircle, LogOut, Menu, Plus, Settings, X } from "lucide-react";
import { APP_NAME } from "@/lib/site-config";

type Job = {
  id: string;
  title: string;
  status: string;
  _count: { candidates: number };
};

type Props = {
  jobs: Job[];
  email: string;
  pendingReviewCount: number;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
};

export function AdminShell({ jobs, email, pendingReviewCount, logoutAction, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const pathname = usePathname();

  // Close sidebar on navigation
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const activeJobs: SidebarJob[] = jobs
    .filter((j) => j.status !== "ARCHIVED")
    .map((j) => ({
      id: j.id,
      title: j.title,
      status: j.status,
      candidateCount: j._count.candidates,
    }));
  const archivedJobs: SidebarJob[] = jobs
    .filter((j) => j.status === "ARCHIVED")
    .map((j) => ({
      id: j.id,
      title: j.title,
      status: j.status,
      candidateCount: j._count.candidates,
    }));

  const sidebarContent = (
    <>
      <Link
        href="/admin"
        className="h-14 flex items-center gap-2.5 px-4 border-b border-slate-200 hover:bg-slate-50 transition-colors shrink-0"
      >
        <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center shrink-0">
          <span className="text-white text-[10px] font-bold">{APP_NAME.charAt(0)}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-900 text-sm block">{APP_NAME}</span>
          <span className="text-[11px] text-slate-500">Internal hiring console</span>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        <div className="space-y-1">
          <Link
            href="/admin/reviews"
            className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <ClipboardCheck className="w-4 h-4 shrink-0 text-slate-500" />
            <span className="flex-1">Reviews</span>
            {pendingReviewCount > 0 && (
              <span className="rounded-full bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[10px] font-semibold">
                {pendingReviewCount}
              </span>
            )}
          </Link>
          <Link
            href="/admin/analytics"
            className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <BarChart3 className="w-4 h-4 shrink-0 text-slate-500" />
            <span className="flex-1">Analytics</span>
          </Link>
          <Link
            href="/admin/help"
            className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <HelpCircle className="w-4 h-4 shrink-0 text-slate-500" />
            <span className="flex-1">How to use</span>
          </Link>
        </div>

        <div>
        <div className="flex items-center justify-between px-2 mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Jobs
          </p>
          <Button asChild type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <Link href="/admin#new-job">
              <Plus className="w-3.5 h-3.5" />
              New
            </Link>
          </Button>
        </div>
        <ul className="space-y-1">
          {activeJobs.length === 0 && archivedJobs.length === 0 ? (
            <li>
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-slate-400 select-none">
                <Briefcase className="w-4 h-4 shrink-0" />
                <span className="truncate">No jobs yet</span>
              </div>
            </li>
          ) : (
            activeJobs.map((job) => <SidebarJobItem key={job.id} job={job} />)
          )}
        </ul>

        {archivedJobs.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="flex w-full items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-700"
            >
              {showArchived ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Archived ({archivedJobs.length})
            </button>
            {showArchived && (
              <ul className="mt-1 space-y-1">
                {archivedJobs.map((job) => (
                  <SidebarJobItem key={job.id} job={job} />
                ))}
              </ul>
            )}
          </div>
        )}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-3 space-y-1 shrink-0">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-slate-600"
        >
          <Link href="/admin/settings">
            <Settings className="w-4 h-4 shrink-0" />
            Settings
          </Link>
        </Button>
        <div className="mb-2 px-2">
          <p className="text-xs text-slate-500 truncate">{email}</p>
        </div>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-slate-600"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign out
          </Button>
        </form>
      </div>
    </>
  );

  return (
    <ToastProvider>
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 bg-white border-r border-slate-200 flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-3.5 right-3 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/admin" className="flex items-center gap-2 lg:hidden">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center shrink-0">
                <span className="text-white text-[9px] font-bold">{APP_NAME.charAt(0)}</span>
              </div>
              <span className="font-semibold text-slate-900 text-sm">{APP_NAME}</span>
            </Link>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/jobs/new">
              <Plus className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Create job</span>
            </Link>
          </Button>
        </header>
        <div className="flex-1 p-4 sm:p-6 overflow-auto">{children}</div>
      </main>
    </div>
    </ToastProvider>
  );
}
