import Link from "next/link";
import { cn } from "@/lib/utils";

export type JobTab = "candidates" | "invites" | "setup";

export const VALID_TABS: readonly JobTab[] = ["candidates", "invites", "setup"];

export function TabStrip({
  jobId,
  active,
  candidatesSubline,
  invitesSubline,
  setupSubline,
}: {
  jobId: string;
  active: JobTab;
  candidatesSubline: string;
  invitesSubline: string;
  setupSubline: string;
}) {
  const tabs: Array<{ key: JobTab; label: string; sub: string }> = [
    { key: "candidates", label: "Candidates", sub: candidatesSubline },
    { key: "invites", label: "Invites", sub: invitesSubline },
    { key: "setup", label: "Role setup", sub: setupSubline },
  ];

  return (
    <nav className="flex gap-1 border-b border-slate-200 px-4 sm:px-6">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Link
            key={tab.key}
            href={`/admin/jobs/${jobId}?tab=${tab.key}`}
            scroll={false}
            className={cn(
              "group flex flex-col gap-0.5 px-3 py-3 text-sm transition-colors",
              isActive
                ? "border-b-2 border-slate-900 -mb-px"
                : "border-b-2 border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <span className={cn("font-medium", isActive ? "text-slate-900" : "")}>
              {tab.label}
            </span>
            <span className="text-[11px] text-slate-400">{tab.sub}</span>
          </Link>
        );
      })}
    </nav>
  );
}
