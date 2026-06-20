const STAGE_LABELS = [
  "Welcome",
  "Background",
  "Role questions",
  "Standard questions",
  "Assessment",
  "Review",
];

export function StageProgress({ currentStage }: { currentStage: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {STAGE_LABELS.map((label, i) => {
          const stage = i + 1;
          const done = stage < currentStage;
          const active = stage === currentStage;
          return (
            <div key={stage} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "bg-slate-900 text-white"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stage
                )}
              </div>
              {/* connector line */}
              {i < STAGE_LABELS.length - 1 && (
                <></>
              )}
            </div>
          );
        })}
      </div>
      {/* progress track */}
      <div className="relative h-1 bg-slate-200 rounded-full">
        <div
          className="absolute left-0 top-0 h-1 bg-slate-900 rounded-full transition-all duration-300"
          style={{ width: `${((currentStage - 1) / 5) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        {STAGE_LABELS.map((label, i) => (
          <span
            key={i}
            className={`text-[10px] font-medium flex-1 text-center ${
              i + 1 === currentStage ? "text-slate-700" : "text-slate-400"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
