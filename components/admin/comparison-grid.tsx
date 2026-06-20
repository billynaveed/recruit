import Link from "next/link";
import type { SynthesisResult, DimensionBand, RoleFitBand } from "@/lib/scoring/synthesis";

type CandidateRow = {
  id: string;
  name: string;
  email: string;
  synthesis: SynthesisResult | null;
};

const DIMENSIONS = [
  { key: "conscientiousness", short: "C" },
  { key: "honesty_humility", short: "H/H" },
  { key: "composure", short: "Comp" },
  { key: "learning", short: "Learn" },
  { key: "interpersonal", short: "Interpersonal" },
];

const ROLE_FIT_BG: Record<RoleFitBand, string> = {
  "Strong fit": "bg-emerald-100 text-emerald-800",
  "Likely fit": "bg-sky-100 text-sky-800",
  "Mixed fit": "bg-amber-100 text-amber-800",
  "Weak fit": "bg-orange-100 text-orange-800",
  "Likely mis-fit": "bg-rose-100 text-rose-800",
};

const BAND_COLOR: Record<DimensionBand, string> = {
  unusually_strong: "bg-emerald-500",
  strong_positive: "bg-emerald-400",
  moderate_positive: "bg-sky-400",
  mixed: "bg-amber-400",
  limited_signal: "bg-slate-300",
  insufficient_signal: "bg-slate-200",
  concern: "bg-rose-400",
};

const BAND_SHORT: Record<DimensionBand, string> = {
  unusually_strong: "Strong+",
  strong_positive: "Strong",
  moderate_positive: "Moderate",
  mixed: "Mixed",
  limited_signal: "Limited",
  insufficient_signal: "Insufficient",
  concern: "Concern",
};

function DimDot({ band }: { band: DimensionBand | undefined }) {
  if (!band) return <div className="w-2.5 h-2.5 rounded-full bg-slate-100" title="No data" />;
  return (
    <div
      className={`w-2.5 h-2.5 rounded-full ${BAND_COLOR[band]}`}
      title={BAND_SHORT[band]}
    />
  );
}

export function ComparisonGrid({ candidates }: { candidates: CandidateRow[] }) {
  const analysed = candidates.filter((c) => c.synthesis?.roleFitRead);
  const pending = candidates.filter((c) => !c.synthesis?.roleFitRead);

  if (candidates.length === 0) {
    return (
      <div className="px-6 py-8 text-sm text-slate-400 text-center">
        No submitted candidates to compare.
      </div>
    );
  }

  return (
    <div className="px-6 py-4 space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-500">
        <span className="font-semibold uppercase tracking-wider">Dimension key:</span>
        {DIMENSIONS.map((d) => (
          <span key={d.key}>{d.short}</span>
        ))}
        <span className="ml-auto flex items-center gap-2 flex-wrap">
          {(["unusually_strong","strong_positive","moderate_positive","mixed","concern","limited_signal"] as DimensionBand[]).map((b) => (
            <span key={b} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full inline-block ${BAND_COLOR[b]}`} />
              <span>{BAND_SHORT[b]}</span>
            </span>
          ))}
        </span>
      </div>

      {/* Header row */}
      <div className="hidden sm:grid grid-cols-[1fr_140px_120px_auto] gap-4 px-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <span>Candidate</span>
        <span>Role-fit</span>
        <span>Dimensions</span>
        <span>Flags</span>
      </div>

      {/* Analysed candidates */}
      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden">
        {analysed.length === 0 && (
          <div className="px-4 py-6 text-sm text-slate-400 text-center">
            No candidates have been analysed yet. Open each candidate and run Analysis.
          </div>
        )}
        {analysed.map((c) => {
          const s = c.synthesis!;
          const highFlags = s.flags.filter((f) => f.severity === "high").length;
          const medFlags = s.flags.filter((f) => f.severity === "medium").length;
          return (
            <Link
              key={c.id}
              href={`/admin/candidates/${c.id}`}
              className="flex flex-col sm:grid sm:grid-cols-[1fr_140px_120px_auto] gap-2 sm:gap-4 px-4 py-3 hover:bg-slate-50 transition-colors items-start sm:items-center group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate group-hover:text-slate-700">{c.name}</p>
                <p className="text-xs text-slate-400 truncate">{c.email}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0 ${ROLE_FIT_BG[s.roleFitRead.band] ?? "bg-slate-100 text-slate-600"}`}>
                {s.roleFitRead.band}
              </span>
              <div className="flex items-center gap-1.5">
                {DIMENSIONS.map((d) => (
                  <DimDot key={d.key} band={s.dimensions[d.key]?.band} />
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-xs shrink-0">
                {highFlags > 0 && (
                  <span className="rounded-full bg-rose-100 text-rose-700 px-1.5 py-0.5 font-semibold">
                    {highFlags} high
                  </span>
                )}
                {medFlags > 0 && (
                  <span className="rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 font-semibold">
                    {medFlags} med
                  </span>
                )}
                {highFlags === 0 && medFlags === 0 && (
                  <span className="text-slate-300">—</span>
                )}
              </div>
            </Link>
          );
        })}

        {/* Pending analysis */}
        {pending.map((c) => (
          <Link
            key={c.id}
            href={`/admin/candidates/${c.id}`}
            className="flex flex-col sm:grid sm:grid-cols-[1fr_140px_120px_auto] gap-2 sm:gap-4 px-4 py-3 hover:bg-slate-50 transition-colors opacity-50 items-start sm:items-center"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
              <p className="text-xs text-slate-400 truncate">{c.email}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-400 shrink-0">
              Not analysed
            </span>
            <div className="flex items-center gap-1.5">
              {DIMENSIONS.map((d) => (
                <DimDot key={d.key} band={undefined} />
              ))}
            </div>
            <span className="text-xs text-slate-300">—</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
