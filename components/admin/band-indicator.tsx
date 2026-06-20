type DimensionBand =
  | "unusually_strong"
  | "strong_positive"
  | "moderate_positive"
  | "mixed"
  | "limited_signal"
  | "insufficient_signal"
  | "concern";

const BAND_LEVEL: Record<string, number> = {
  unusually_strong: 5,
  strong_positive: 4,
  moderate_positive: 3,
  mixed: 2,
  limited_signal: 1,
  insufficient_signal: 0,
};

const BAND_LABEL: Record<string, string> = {
  unusually_strong: "Unusually strong",
  strong_positive: "Strong positive",
  moderate_positive: "Moderate positive",
  mixed: "Mixed signal",
  limited_signal: "Limited signal",
  insufficient_signal: "Insufficient signal",
  concern: "Concern",
};

const BAND_COLOR: Record<string, string> = {
  unusually_strong: "text-emerald-700",
  strong_positive: "text-emerald-700",
  moderate_positive: "text-sky-700",
  mixed: "text-amber-700",
  limited_signal: "text-slate-500",
  insufficient_signal: "text-slate-400",
  concern: "text-rose-700",
};

type Props = {
  band: DimensionBand | string;
  showLabel?: boolean;
  size?: "sm" | "md";
};

export function BandIndicator({ band, showLabel = true, size = "sm" }: Props) {
  const label = BAND_LABEL[band] ?? band.replace(/_/g, " ");
  const colorClass = BAND_COLOR[band] ?? "text-slate-500";

  if (band === "concern") {
    return (
      <span className={`inline-flex items-center gap-1.5 ${colorClass}`}>
        <span className="flex gap-0.5" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="inline-block rounded-[1px] bg-rose-500"
              style={{ width: size === "sm" ? 6 : 8, height: size === "sm" ? 6 : 8 }}
            />
          ))}
        </span>
        {showLabel && <span className={`${size === "sm" ? "text-xs" : "text-sm"} font-medium`}>{label}</span>}
      </span>
    );
  }

  const level = BAND_LEVEL[band] ?? 0;

  return (
    <span className={`inline-flex items-center gap-1.5 ${colorClass}`}>
      <span className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`inline-block rounded-[1px] ${
              i < level
                ? band === "mixed"
                  ? "bg-amber-400"
                  : level >= 3
                  ? "bg-emerald-500"
                  : "bg-slate-400"
                : "bg-slate-200"
            }`}
            style={{ width: size === "sm" ? 6 : 8, height: size === "sm" ? 6 : 8 }}
          />
        ))}
      </span>
      {showLabel && <span className={`${size === "sm" ? "text-xs" : "text-sm"} font-medium`}>{label}</span>}
    </span>
  );
}
